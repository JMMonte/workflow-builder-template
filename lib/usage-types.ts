import type { RunStatus } from "./workflow-run";

export type BlockUsage = {
  workflowId: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  runs: number;
  lastUsedAt: string | null;
};

export type AgentUsage = {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  totalRuns: number;
  lastRunAt: string | null;
  lastRunStatus: RunStatus | null;
  lastRunDuration: string | null;
  blockUsage: BlockUsage[];
};

export type AgentRunStat = {
  workflowId: string;
  startedAt: string; // ISO timestamp for individual execution
};

export type UsageSummaryResponse = {
  agents: AgentUsage[];
  agentRunStats: AgentRunStat[];
};
