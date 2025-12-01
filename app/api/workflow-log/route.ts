import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflowExecutionLogs, workflowExecutions } from "@/lib/db/schema";
import type { LogApiPayload, RunStatus } from "@/lib/workflow-run";

const executionStatuses: RunStatus[] = [
  "pending",
  "running",
  "success",
  "error",
  "cancelled",
];

const isExecutionStatus = (status: unknown): status is RunStatus =>
  executionStatuses.includes(status as RunStatus);

async function startNodeLog(data: {
  executionId: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  input: unknown;
}) {
  const { executionId, nodeId, nodeName, nodeType, input } = data;

  const [log] = await db
    .insert(workflowExecutionLogs)
    .values({
      executionId,
      nodeId,
      nodeName,
      nodeType,
      status: "running",
      input,
      startedAt: new Date(),
    })
    .returning();

  return NextResponse.json({
    logId: log.id,
    startTime: Date.now(),
  });
}

async function completeExecution(data: {
  executionId: string;
  status: RunStatus;
  output: unknown;
  error: string | null;
  startTime: number;
}) {
  const { executionId: execId, status, output, error, startTime } = data;
  const duration = Date.now() - startTime;

  // Skip updates if the execution has already been cancelled
  const existingExecution = await db.query.workflowExecutions.findFirst({
    where: eq(workflowExecutions.id, execId),
    columns: {
      status: true,
    },
  });

  if (!existingExecution || existingExecution.status === "cancelled") {
    return NextResponse.json({ success: true });
  }

  await db
    .update(workflowExecutions)
    .set({
      status,
      output,
      error,
      completedAt: new Date(),
      duration: duration.toString(),
    })
    .where(eq(workflowExecutions.id, execId));

  return NextResponse.json({ success: true });
}

async function completeNodeLog(data: {
  logId?: string;
  startTime?: number;
  status?: "success" | "error";
  output?: unknown;
  error?: string;
}) {
  const { logId, startTime, status, output, error } = data;

  if (!logId) {
    return NextResponse.json({ success: true });
  }

  const duration = startTime ? Date.now() - startTime : 0;

  await db
    .update(workflowExecutionLogs)
    .set({
      status,
      output,
      error,
      completedAt: new Date(),
      duration: duration.toString(),
    })
    .where(eq(workflowExecutionLogs.id, logId));

  return NextResponse.json({ success: true });
}

async function handleCompleteAction(data: {
  executionId?: string;
  logId?: string;
  status?: RunStatus;
  output?: unknown;
  error?: string | null;
  startTime?: number;
}) {
  if (data.executionId && !data.logId) {
    if (!isExecutionStatus(data.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    return await completeExecution({
      executionId: data.executionId,
      status: data.status,
      output: data.output,
      error: data.error ?? null,
      startTime: data.startTime ?? Date.now(),
    });
  }

  return await completeNodeLog({
    logId: data.logId,
    startTime: data.startTime,
    status: data.status as "success" | "error" | undefined,
    output: data.output,
    error: data.error ?? undefined,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body as { action: string; data: LogApiPayload };

    if (action === "start") {
      if (
        !(data.executionId && data.nodeId && data.nodeName && data.nodeType)
      ) {
        return NextResponse.json(
          { error: "Missing required fields for start action" },
          { status: 400 }
        );
      }
      return startNodeLog(
        data as {
          executionId: string;
          nodeId: string;
          nodeName: string;
          nodeType: string;
          input: unknown;
        }
      );
    }

    if (action === "complete") {
      return handleCompleteAction(data);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to log node execution:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to log",
      },
      { status: 500 }
    );
  }
}
