import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflowExecutionLogs, workflowExecutions } from "@/lib/db/schema";
import { requireTeamContext } from "@/lib/team-context";

export async function POST(
  request: Request,
  context: { params: Promise<{ executionId: string }> }
) {
  try {
    const { executionId } = await context.params;
    const teamContext = await requireTeamContext(request);

    if (!teamContext.ok) {
      return teamContext.response;
    }

    const execution = await db.query.workflowExecutions.findFirst({
      where: eq(workflowExecutions.id, executionId),
      with: {
        workflow: true,
      },
    });

    if (!execution) {
      return NextResponse.json(
        { error: "Execution not found" },
        { status: 404 }
      );
    }

    if (execution.workflow.teamId !== teamContext.team.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (execution.status !== "running") {
      return NextResponse.json({
        status: execution.status,
        message: "Execution is not running",
      });
    }

    const now = new Date();
    const duration =
      execution.startedAt?.getTime() !== undefined
        ? (now.getTime() - execution.startedAt.getTime()).toString()
        : null;

    // Update execution to cancelled
    await db
      .update(workflowExecutions)
      .set({
        status: "cancelled",
        error: "Execution cancelled by user",
        completedAt: now,
        duration,
      })
      .where(eq(workflowExecutions.id, executionId));

    // Mark any running node logs as cancelled/error
    const runningLogs = await db.query.workflowExecutionLogs.findMany({
      where: and(
        eq(workflowExecutionLogs.executionId, executionId),
        eq(workflowExecutionLogs.status, "running")
      ),
    });

    if (runningLogs.length > 0) {
      await Promise.all(
        runningLogs.map((log) => {
          const logDuration =
            log.startedAt?.getTime() !== undefined
              ? (now.getTime() - log.startedAt.getTime()).toString()
              : null;

          return db
            .update(workflowExecutionLogs)
            .set({
              status: "error",
              error: "Execution cancelled",
              completedAt: now,
              duration: logDuration,
            })
            .where(eq(workflowExecutionLogs.id, log.id));
        })
      );
    }

    return NextResponse.json({
      status: "cancelled",
      cancelledAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Failed to cancel execution:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to cancel execution",
      },
      { status: 500 }
    );
  }
}
