import type { WorkflowExecution, WorkflowExecutionLog } from "@/lib/db/schema";

export type RunStatus =
  | "pending"
  | "running"
  | "success"
  | "error"
  | "cancelled";
export type NodeStatus = "pending" | "running" | "success" | "error";

export type WorkflowRun = WorkflowExecution;

export type WorkflowRunLog = WorkflowExecutionLog;

export type RunInput = {
  workflowId: string;
  input?: Record<string, unknown>;
};

export type LogEntryInput = {
  action: "start" | "complete";
  executionId?: string;
  nodeId?: string;
  nodeName?: string;
  nodeType?: string;
  nodeInput?: unknown;
  logId?: string;
  startTime?: number;
  status?: RunStatus | NodeStatus;
  output?: unknown;
  error?: string;
};

export type LogApiPayload = Omit<LogEntryInput, "nodeInput"> & {
  input?: unknown;
};

export type ExecutionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export type NodeOutputs = Record<string, { label: string; data: unknown }>;
