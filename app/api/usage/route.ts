import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  workflowExecutionLogs,
  workflowExecutions,
  workflows,
} from "@/lib/db/schema";
import { requireTeamContext } from "@/lib/team-context";
import type { BlockUsage, UsageSummaryResponse } from "@/lib/usage-types";
import type { RunStatus } from "@/lib/workflow-run";

type ExecutionStatRow = {
  workflow_id: string;
  total_runs: number;
  last_run_at: Date;
  last_status: RunStatus | null;
  last_duration: string | null;
};

type BlockUsageRow = {
  workflowId: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  runs: number;
  lastUsedAt: Date | null;
};

type RunHistoryRow = {
  workflowId: string;
  startedAt: Date;
};

function normalizeDate(value: Date | null): string | null {
  if (!value) {
    return null;
  }
  return new Date(value).toISOString();
}

function buildBlockUsageMap(
  usageRows: BlockUsageRow[],
  allowedWorkflowIds: Set<string>
) {
  const blockUsageMap = new Map<string, BlockUsage[]>();

  for (const usage of usageRows) {
    if (!allowedWorkflowIds.has(usage.workflowId)) {
      continue;
    }

    const usageEntry: BlockUsage = {
      workflowId: usage.workflowId,
      nodeId: usage.nodeId,
      nodeName: usage.nodeName,
      nodeType: usage.nodeType,
      runs: Number(usage.runs ?? 0),
      lastUsedAt: normalizeDate(usage.lastUsedAt),
    };

    const existing = blockUsageMap.get(usage.workflowId) ?? [];
    existing.push(usageEntry);
    blockUsageMap.set(usage.workflowId, existing);
  }

  return blockUsageMap;
}

function buildExecutionStatsMap(executionStats: ExecutionStatRow[]) {
  const statsMap = new Map<
    string,
    {
      totalRuns: number;
      lastRunAt: string | null;
      lastRunStatus: RunStatus | null;
      lastRunDuration: string | null;
    }
  >();

  for (const row of executionStats) {
    statsMap.set(row.workflow_id, {
      totalRuns: Number(row.total_runs ?? 0),
      lastRunAt: normalizeDate(row.last_run_at),
      lastRunStatus: row.last_status ?? null,
      lastRunDuration: row.last_duration ?? null,
    });
  }

  return statsMap;
}

export async function GET(request: Request) {
  const teamContext = await requireTeamContext(request);

  if (!teamContext.ok) {
    return teamContext.response;
  }

  const teamId = teamContext.team.id;

  try {
    const teamWorkflows = await db.query.workflows.findMany({
      where: eq(workflows.teamId, teamId),
      columns: { id: true, name: true, icon: true, iconColor: true },
    });

    const workflowsForUsage = teamWorkflows.filter(
      (workflow) => workflow.name !== "__current__"
    );

    if (workflowsForUsage.length === 0) {
      return NextResponse.json<UsageSummaryResponse>({
        agents: [],
        agentRunStats: [],
      });
    }

    const workflowIds = workflowsForUsage.map((workflow) => workflow.id);
    const workflowIdSet = new Set(workflowIds);

    const executionStats = await db.execute<ExecutionStatRow>(
      sql`
        select workflow_id, total_runs, last_run_at, last_status, last_duration from (
          select
            we.workflow_id,
            count(*) over (partition by we.workflow_id) as total_runs,
            first_value(we.started_at) over (partition by we.workflow_id order by we.started_at desc) as last_run_at,
            first_value(we.status) over (partition by we.workflow_id order by we.started_at desc) as last_status,
            first_value(we.duration) over (partition by we.workflow_id order by we.started_at desc) as last_duration,
            row_number() over (partition by we.workflow_id order by we.started_at desc) as row_number
          from ${workflowExecutions} we
          inner join ${workflows} w on we.workflow_id = w.id
          where w.team_id = ${teamId}
        ) ranked
        where row_number = 1
      `
    );

    const blockUsage = await db
      .select({
        workflowId: workflowExecutions.workflowId,
        nodeId: workflowExecutionLogs.nodeId,
        nodeName: workflowExecutionLogs.nodeName,
        nodeType: workflowExecutionLogs.nodeType,
        runs: sql<number>`count(${workflowExecutionLogs.id})`,
        lastUsedAt: sql<Date | null>`max(${workflowExecutionLogs.startedAt})`,
      })
      .from(workflowExecutionLogs)
      .innerJoin(
        workflowExecutions,
        eq(workflowExecutionLogs.executionId, workflowExecutions.id)
      )
      .innerJoin(workflows, eq(workflowExecutions.workflowId, workflows.id))
      .where(
        and(
          eq(workflows.teamId, teamId),
          inArray(workflowExecutions.workflowId, workflowIds)
        )
      )
      .groupBy(
        workflowExecutions.workflowId,
        workflowExecutionLogs.nodeId,
        workflowExecutionLogs.nodeName,
        workflowExecutionLogs.nodeType
      );

    const blockUsageMap = buildBlockUsageMap(
      blockUsage as BlockUsageRow[],
      workflowIdSet
    );
    const statsMap = buildExecutionStatsMap(
      executionStats as ExecutionStatRow[]
    );

    const runHistory = await db
      .select({
        workflowId: workflowExecutions.workflowId,
        startedAt: workflowExecutions.startedAt,
      })
      .from(workflowExecutions)
      .innerJoin(workflows, eq(workflowExecutions.workflowId, workflows.id))
      .where(
        and(
          eq(workflows.teamId, teamId),
          gte(workflowExecutions.startedAt, sql`now() - interval '180 days'`)
        )
      )
      .orderBy(sql`${workflowExecutions.startedAt} desc`);

    const agents = workflowsForUsage.map((workflow) => {
      const stats = statsMap.get(workflow.id);
      const workflowBlockUsage = blockUsageMap.get(workflow.id) ?? [];

      return {
        id: workflow.id,
        name: workflow.name,
        icon: workflow.icon,
        iconColor: workflow.iconColor,
        totalRuns: stats?.totalRuns ?? 0,
        lastRunAt: stats?.lastRunAt ?? null,
        lastRunStatus: stats?.lastRunStatus ?? null,
        lastRunDuration: stats?.lastRunDuration ?? null,
        blockUsage: workflowBlockUsage.sort((a, b) => b.runs - a.runs),
      };
    });

    return NextResponse.json<UsageSummaryResponse>({
      agents,
      agentRunStats: (runHistory as RunHistoryRow[]).map((entry) => ({
        workflowId: entry.workflowId,
        startedAt:
          normalizeDate(entry.startedAt) ??
          new Date(entry.startedAt).toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to load usage data:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load usage data",
      },
      { status: 500 }
    );
  }
}
