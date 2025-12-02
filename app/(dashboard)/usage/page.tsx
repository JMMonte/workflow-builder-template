"use client";

import { Check, ChevronDown, RefreshCw, X } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  GridTable,
  type GridTableColumn,
  GridTableRow,
} from "@/components/ui/grid-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  getWorkflowIconColors,
  WorkflowIconDisplay,
} from "@/components/workflow/workflow-icon-options";
import { api } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import type { AgentRunStat, AgentUsage } from "@/lib/usage-types";
import { cn } from "@/lib/utils";
import { getRelativeTime } from "@/lib/utils/time";

const AGENT_GRID_TEMPLATE =
  "grid-cols-[minmax(220px,1.4fr)_120px_minmax(200px,1fr)_120px]";
const BLOCK_GRID_TEMPLATE =
  "grid-cols-[minmax(200px,1.2fr)_minmax(200px,1fr)_140px_90px_minmax(180px,1fr)]";

const AGENT_COLUMNS: GridTableColumn[] = [
  { id: "agent", label: "Agent" },
  { id: "runs", label: "Runs", align: "right" },
  { id: "lastRun", label: "Last run" },
  { id: "status", label: "Status", align: "right" },
];

const BLOCK_COLUMNS: GridTableColumn[] = [
  { id: "agent", label: "Agent" },
  { id: "block", label: "Block" },
  { id: "type", label: "Type" },
  { id: "runs", label: "Runs", align: "right" },
  { id: "lastUsed", label: "Last used" },
];

const PERIOD_OPTIONS: Array<{ value: string; label: string; days?: number }> = [
  { value: "24h", label: "Last 24 hours", days: 1 },
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "custom", label: "Custom" },
];

function StatusBadge({ status }: { status: AgentUsage["lastRunStatus"] }) {
  if (!status) {
    return (
      <span className="rounded-full border border-border bg-muted/40 px-2 py-1 font-medium text-muted-foreground text-xs">
        No runs yet
      </span>
    );
  }

  const statusStyles =
    {
      success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      error: "bg-destructive/10 text-destructive border-destructive/20",
      cancelled: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      running: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      pending: "bg-muted/30 text-muted-foreground border-border",
    }[status] ?? "bg-muted/30 text-muted-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-1 font-medium text-xs capitalize",
        statusStyles
      )}
    >
      {status}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-2 font-semibold text-2xl leading-tight">{value}</p>
      {helper ? (
        <p className="mt-1 text-muted-foreground text-xs">{helper}</p>
      ) : null}
    </Card>
  );
}

function AgentRow({ agent }: { agent: AgentUsage }) {
  const iconColors = getWorkflowIconColors(agent.iconColor);

  return (
    <GridTableRow className="items-center" template={AGENT_GRID_TEMPLATE}>
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-md"
          style={{
            color: iconColors.color,
            backgroundColor: iconColors.backgroundColor,
          }}
        >
          <WorkflowIconDisplay
            className="size-4"
            color={iconColors.color}
            value={agent.icon}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">{agent.name}</p>
          <p className="text-muted-foreground text-xs">
            {agent.totalRuns > 0
              ? `${agent.totalRuns.toLocaleString()} ${
                  agent.totalRuns === 1 ? "run" : "runs"
                } tracked`
              : "No runs yet"}
          </p>
        </div>
      </div>
      <div className="text-right font-mono text-sm tabular-nums">
        {agent.totalRuns.toLocaleString()}
      </div>
      <div className="min-w-0 text-sm">
        {agent.lastRunAt ? (
          <>
            <p className="font-medium">{getRelativeTime(agent.lastRunAt)}</p>
            <p className="text-muted-foreground text-xs">
              {new Date(agent.lastRunAt).toLocaleString()}
            </p>
          </>
        ) : (
          <div>
            <p className="font-medium text-muted-foreground">—</p>
            <p className="text-muted-foreground text-xs">No date recorded</p>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <StatusBadge status={agent.lastRunStatus} />
      </div>
    </GridTableRow>
  );
}

type BlockRow = {
  agentId: string;
  agentName: string;
  agentIcon: string;
  agentIconColor: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  runs: number;
  lastUsedAt: string | null;
  key: string;
};

type UsageChartBucket = {
  start: Date;
  total: number;
};

type UsageRange = { start: number; end: number };

function getRangeForPeriod(
  selectedPeriod: string,
  periodMeta: { value: string; label: string; days?: number } | undefined,
  customStart: string,
  customEnd: string
) {
  const now = new Date();
  const end = new Date(now);
  end.setMilliseconds(0);

  if (selectedPeriod === "custom" && customStart && customEnd) {
    const start = new Date(customStart);
    start.setHours(0, 0, 0, 0);
    const finish = new Date(customEnd);
    finish.setHours(23, 59, 59, 999);
    return { start: start.getTime(), end: finish.getTime() };
  }

  if (selectedPeriod === "24h") {
    const start = new Date(end);
    start.setTime(end.getTime() - 24 * 60 * 60 * 1000);
    return { start: start.getTime(), end: end.getTime() };
  }

  const days = periodMeta?.days ?? 7;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return { start: start.getTime(), end: end.getTime() };
}

function alignToBucketStart(date: Date, granularity: "hour" | "day" | "week") {
  const copy = new Date(date);
  if (granularity === "hour") {
    copy.setMinutes(0, 0, 0);
  } else if (granularity === "day") {
    copy.setHours(0, 0, 0, 0);
  } else {
    const day = copy.getDay();
    const diff = day === 0 ? 6 : day - 1;
    copy.setHours(0, 0, 0, 0);
    copy.setDate(copy.getDate() - diff);
  }
  return copy;
}

function nextBucketStart(
  start: Date,
  granularity: "hour" | "day" | "week"
): Date {
  const next = new Date(start);
  if (granularity === "hour") {
    next.setHours(next.getHours() + 1);
  } else if (granularity === "day") {
    next.setDate(next.getDate() + 1);
  } else {
    next.setDate(next.getDate() + 7);
  }
  return next;
}

function bucketRunsForGranularity(
  runs: AgentRunStat[],
  granularity: "hour" | "day" | "week",
  range: UsageRange
): UsageChartBucket[] {
  const buckets = new Map<string, UsageChartBucket>();

  for (const stat of runs) {
    const started = new Date(stat.startedAt);
    const bucketStart = alignToBucketStart(started, granularity);
    const key = bucketStart.toISOString();
    const entry = buckets.get(key) ?? { start: bucketStart, total: 0 };
    entry.total += 1;
    buckets.set(key, entry);
  }

  const filled: UsageChartBucket[] = [];
  let cursor = alignToBucketStart(new Date(range.start), granularity);
  const end = new Date(range.end);

  while (cursor.getTime() <= end.getTime()) {
    const key = cursor.toISOString();
    const existing = buckets.get(key);
    filled.push(
      existing ?? {
        start: new Date(cursor),
        total: 0,
      }
    );
    cursor = nextBucketStart(cursor, granularity);
  }

  return filled;
}

function formatBucketLabel(date: Date, granularity: "hour" | "day" | "week") {
  if (granularity === "hour") {
    return date.toLocaleString(undefined, {
      hour: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  if (granularity === "week") {
    return `Week of ${date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}`;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function BlockUsageRow({ row }: { row: BlockRow }) {
  const iconColors = getWorkflowIconColors(row.agentIconColor);

  return (
    <GridTableRow className="items-center" template={BLOCK_GRID_TEMPLATE}>
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-md"
          style={{
            color: iconColors.color,
            backgroundColor: iconColors.backgroundColor,
          }}
        >
          <WorkflowIconDisplay
            className="size-4"
            color={iconColors.color}
            value={row.agentIcon}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">{row.agentName}</p>
        </div>
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-sm">{row.nodeName}</p>
      </div>
      <div className="text-muted-foreground text-sm capitalize">
        {row.nodeType}
      </div>
      <div className="text-right font-mono text-sm tabular-nums">
        {row.runs.toLocaleString()}
      </div>
      <div className="min-w-0 text-sm">
        {row.lastUsedAt ? (
          <>
            <p className="font-medium">{getRelativeTime(row.lastUsedAt)}</p>
            <p className="text-muted-foreground text-xs">
              {new Date(row.lastUsedAt).toLocaleString()}
            </p>
          </>
        ) : (
          <div>
            <p className="font-medium text-muted-foreground">—</p>
            <p className="text-muted-foreground text-xs">No date recorded</p>
          </div>
        )}
      </div>
    </GridTableRow>
  );
}

function BlockUsageChartSection({
  agents,
  loading,
}: {
  agents: AgentUsage[];
  loading?: boolean;
}) {
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [selectedBlockType, setSelectedBlockType] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("7d");
  const [selectedGranularity, setSelectedGranularity] = useState<
    "hour" | "day" | "week"
  >("day");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [showMultiBlock, setShowMultiBlock] = useState<boolean>(false);

  // Extract all unique blocks from all agents
  const allBlocks = useMemo(() => {
    const blocks: Array<{
      id: string;
      name: string;
      type: string;
      agentId: string;
      agentName: string;
      agentIcon: string;
      agentIconColor: string;
      runs: number;
      lastUsedAt: string | null;
    }> = [];

    for (const agent of agents) {
      for (const block of agent.blockUsage) {
        blocks.push({
          id: `${agent.id}-${block.nodeId}`,
          name: block.nodeName,
          type: block.nodeType,
          agentId: agent.id,
          agentName: agent.name,
          agentIcon: agent.icon,
          agentIconColor: agent.iconColor,
          runs: block.runs,
          lastUsedAt: block.lastUsedAt,
        });
      }
    }

    return blocks;
  }, [agents]);

  // Get unique block types
  const blockTypes = useMemo(() => {
    const types = new Set(allBlocks.map((block) => block.type));
    return Array.from(types).sort();
  }, [allBlocks]);

  const toggleBlock = (blockId: string) => {
    setSelectedBlocks((prev) =>
      prev.includes(blockId)
        ? prev.filter((id) => id !== blockId)
        : [...prev, blockId]
    );
  };

  const clearBlocks = () => {
    setSelectedBlocks([]);
  };

  useEffect(() => {
    if (selectedPeriod === "custom" && !customStart && !customEnd) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      setCustomStart(start.toISOString().slice(0, 10));
      setCustomEnd(end.toISOString().slice(0, 10));
    }
  }, [customEnd, customStart, selectedPeriod]);

  const periodMeta = useMemo(
    () => PERIOD_OPTIONS.find((option) => option.value === selectedPeriod),
    [selectedPeriod]
  );

  const range = useMemo(
    () => getRangeForPeriod(selectedPeriod, periodMeta, customStart, customEnd),
    [customEnd, customStart, periodMeta, selectedPeriod]
  );

  // Filter blocks based on selections
  const filteredBlocks = useMemo(() => {
    let blocks = allBlocks;

    // Filter by block type
    if (selectedBlockType !== "all") {
      blocks = blocks.filter((block) => block.type === selectedBlockType);
    }

    // Filter by selected blocks
    if (selectedBlocks.length > 0) {
      blocks = blocks.filter((block) => selectedBlocks.includes(block.id));
    }

    // Filter by date range
    blocks = blocks.filter((block) => {
      if (!block.lastUsedAt) return false;
      const time = new Date(block.lastUsedAt).getTime();
      return time >= range.start && time <= range.end;
    });

    return blocks;
  }, [allBlocks, selectedBlockType, selectedBlocks, range]);

  // Aggregate block runs into time buckets
  const bucketedBlockRuns = useMemo(() => {
    const buckets = new Map<string, number>();

    for (const block of filteredBlocks) {
      if (!block.lastUsedAt) continue;
      const date = new Date(block.lastUsedAt);
      const bucketStart = alignToBucketStart(date, selectedGranularity);
      const key = bucketStart.toISOString();
      buckets.set(key, (buckets.get(key) || 0) + block.runs);
    }

    const filled: UsageChartBucket[] = [];
    let cursor = alignToBucketStart(new Date(range.start), selectedGranularity);
    const end = new Date(range.end);

    while (cursor.getTime() <= end.getTime()) {
      const key = cursor.toISOString();
      filled.push({
        start: new Date(cursor),
        total: buckets.get(key) || 0,
      });
      cursor = nextBucketStart(cursor, selectedGranularity);
    }

    return filled;
  }, [filteredBlocks, range, selectedGranularity]);

  const maxBucket = useMemo(
    () => Math.max(1, ...bucketedBlockRuns.map((bucket) => bucket.total)),
    [bucketedBlockRuns]
  );

  // Multi-block data for split view
  const multiBlockData = useMemo(() => {
    if (!showMultiBlock) {
      return null;
    }

    const blocksToShow = filteredBlocks.filter((block) => block.runs > 0);

    if (blocksToShow.length === 0) {
      return null;
    }

    // Create empty buckets
    const buckets: Array<{ label: string; [blockId: string]: number | string }> = [];
    let cursor = alignToBucketStart(new Date(range.start), selectedGranularity);
    const end = new Date(range.end);

    while (cursor.getTime() <= end.getTime()) {
      buckets.push({ label: formatBucketLabel(new Date(cursor), selectedGranularity) });
      cursor = nextBucketStart(cursor, selectedGranularity);
    }

    // Distribute runs across buckets (simplified - using lastUsedAt)
    for (const block of blocksToShow) {
      if (!block.lastUsedAt) continue;
      const bucketStart = alignToBucketStart(new Date(block.lastUsedAt), selectedGranularity);
      const bucketLabel = formatBucketLabel(bucketStart, selectedGranularity);
      const bucket = buckets.find((b) => b.label === bucketLabel);
      if (bucket) {
        bucket[block.id] = ((bucket[block.id] as number) || 0) + block.runs;
      }
    }

    return {
      blocks: blocksToShow,
      data: buckets,
    };
  }, [showMultiBlock, filteredBlocks, range, selectedGranularity]);

  let chartContent: ReactNode;
  if (loading) {
    chartContent = <Skeleton className="h-40 w-full rounded-md" />;
  } else if (allBlocks.length === 0) {
    chartContent = (
      <div className="rounded-md bg-muted/20 p-6 text-center">
        <p className="font-medium text-sm">No block usage yet</p>
        <p className="text-muted-foreground text-xs">
          Execute agents to see block usage.
        </p>
      </div>
    );
  } else if (filteredBlocks.length === 0) {
    chartContent = (
      <div className="rounded-md bg-muted/20 p-6 text-center">
        <p className="font-medium text-sm">No blocks in this period</p>
        <p className="text-muted-foreground text-xs">
          Try widening the date range or removing filters.
        </p>
      </div>
    );
  } else if (showMultiBlock && multiBlockData) {
    // Multi-block bar chart
    const chartHeight = 240;

    const getMultiBlockTickInterval = () => {
      const dataPoints = multiBlockData.data.length;
      if (dataPoints <= 7) return 0;
      if (dataPoints <= 24) return "preserveStartEnd";
      if (dataPoints <= 48) return Math.floor(dataPoints / 8);
      return Math.floor(dataPoints / 10);
    };

    chartContent = (
      <div className="rounded-md bg-muted/10 p-4">
        <ResponsiveContainer height={chartHeight} width="100%">
          <BarChart
            data={multiBlockData.data}
            margin={{ top: 10, right: 16, left: 16, bottom: 20 }}
          >
            <YAxis
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
            />
            <XAxis
              axisLine={false}
              dataKey="label"
              interval={getMultiBlockTickInterval()}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (!(active && payload && payload.length)) {
                  return null;
                }
                return (
                  <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
                    <p className="mb-1 font-semibold text-sm">
                      {payload[0].payload.label}
                    </p>
                    {payload.map((entry, index) => {
                      const block = multiBlockData.blocks.find((b) => b.id === entry.dataKey);
                      return (
                        <div
                          className="flex items-center gap-2 text-xs"
                          key={index}
                        >
                          <div
                            className="size-2 rounded-sm"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-muted-foreground">
                            {block?.name}:
                          </span>
                          <span className="font-medium">
                            {entry.value?.toLocaleString() || 0}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
              cursor={{ fill: "var(--muted)", opacity: 0.2 }}
            />
            <Legend
              iconType="rect"
              wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
            />
            {multiBlockData.blocks.map((block) => {
              const iconColors = getWorkflowIconColors(block.agentIconColor);
              return (
                <Bar
                  dataKey={block.id}
                  fill={iconColors.color}
                  key={block.id}
                  name={block.name}
                  radius={[4, 4, 0, 0]}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  } else {
    // Combined area chart
    const chartHeight = 180;

    const chartData = bucketedBlockRuns.map((bucket) => ({
      label: formatBucketLabel(bucket.start, selectedGranularity),
      runs: bucket.total,
    }));

    const getTickInterval = () => {
      const dataPoints = chartData.length;
      if (dataPoints <= 7) return 0;
      if (dataPoints <= 24) return "preserveStartEnd";
      if (dataPoints <= 48) return Math.floor(dataPoints / 8);
      return Math.floor(dataPoints / 10);
    };

    chartContent = (
      <div className="rounded-md bg-muted/10 p-4">
        <ResponsiveContainer height={chartHeight} width="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 16, left: 16, bottom: 20 }}
          >
            <defs>
              <linearGradient
                id="blockUsageGradient"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="currentColor"
                  stopOpacity={0.22}
                />
                <stop
                  offset="100%"
                  stopColor="currentColor"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <YAxis
              axisLine={false}
              domain={[0, maxBucket]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
            />
            <XAxis
              axisLine={false}
              dataKey="label"
              interval={getTickInterval()}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (!(active && payload && payload.length)) {
                  return null;
                }
                const datum = payload[0].payload as {
                  label: string;
                  runs: number;
                };
                return (
                  <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
                    <p className="font-semibold text-sm">{datum.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {datum.runs.toLocaleString()} block run
                      {datum.runs === 1 ? "" : "s"}
                    </p>
                  </div>
                );
              }}
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            />
            <Area
              className="text-primary"
              dataKey="runs"
              fill="url(#blockUsageGradient)"
              stroke="currentColor"
              strokeLinecap="butt"
              strokeLinejoin="miter"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const availableBlocks = useMemo(() => {
    let blocks = allBlocks;
    if (selectedBlockType !== "all") {
      blocks = blocks.filter((block) => block.type === selectedBlockType);
    }
    return blocks.filter((block) => block.runs > 0);
  }, [allBlocks, selectedBlockType]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-muted-foreground text-sm">
          Block executions over your selected period and granularity.
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            onValueChange={(value) => setSelectedBlockType(value)}
            value={selectedBlockType}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Block type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {blockTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                {selectedBlocks.length === 0 ? (
                  "All blocks"
                ) : (
                  <span className="truncate">
                    {selectedBlocks.length} block{selectedBlocks.length === 1 ? "" : "s"}
                  </span>
                )}
                <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px] max-h-[300px] overflow-y-auto" align="start">
              {selectedBlocks.length > 0 && (
                <>
                  <DropdownMenuItem
                    onClick={clearBlocks}
                    className="cursor-pointer"
                  >
                    <X className="mr-2 size-4" />
                    Clear selection
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {availableBlocks.map((block) => (
                <DropdownMenuItem
                  key={block.id}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleBlock(block.id);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex size-4 items-center justify-center">
                      {selectedBlocks.includes(block.id) && (
                        <Check className="size-4" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className={selectedBlocks.includes(block.id) ? "font-medium text-xs" : "text-xs"}>
                        {block.name}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        {block.agentName}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ToggleGroup
            type="single"
            value={showMultiBlock ? "split" : "combined"}
            onValueChange={(value) => {
              if (value) setShowMultiBlock(value === "split");
            }}
            className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
          >
            <ToggleGroupItem
              value="combined"
              aria-label="Combined view"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              Combined
            </ToggleGroupItem>
            <ToggleGroupItem
              value="split"
              aria-label="Split view"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              Split
            </ToggleGroupItem>
          </ToggleGroup>
          <Select
            onValueChange={(value) =>
              setSelectedGranularity(value as "hour" | "day" | "week")
            }
            value={selectedGranularity}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Granularity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Per hour</SelectItem>
              <SelectItem value="day">Per day</SelectItem>
              <SelectItem value="week">Per week</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) => setSelectedPeriod(value)}
            value={selectedPeriod}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPeriod === "custom" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                aria-label="Custom start date"
                className="h-9"
                onChange={(event) => setCustomStart(event.target.value)}
                type="date"
                value={customStart}
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                aria-label="Custom end date"
                className="h-9"
                onChange={(event) => setCustomEnd(event.target.value)}
                type="date"
                value={customEnd}
              />
            </div>
          ) : null}
        </div>
      </div>

      {chartContent}
    </div>
  );
}

function UsageChartSection({
  agents,
  runStats,
  loading,
}: {
  agents: AgentUsage[];
  runStats: AgentRunStat[];
  loading?: boolean;
}) {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("7d");
  const [selectedGranularity, setSelectedGranularity] = useState<
    "hour" | "day" | "week"
  >("day");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [showMultiAgent, setShowMultiAgent] = useState<boolean>(false);

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const clearAgents = () => {
    setSelectedAgents([]);
  };

  useEffect(() => {
    if (selectedPeriod === "custom" && !customStart && !customEnd) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      setCustomStart(start.toISOString().slice(0, 10));
      setCustomEnd(end.toISOString().slice(0, 10));
    }
  }, [customEnd, customStart, selectedPeriod]);

  const periodMeta = useMemo(
    () => PERIOD_OPTIONS.find((option) => option.value === selectedPeriod),
    [selectedPeriod]
  );

  const range = useMemo(
    () => getRangeForPeriod(selectedPeriod, periodMeta, customStart, customEnd),
    [customEnd, customStart, periodMeta, selectedPeriod]
  );

  const filteredRuns = useMemo(
    () =>
      runStats.filter((stat) => {
        if (selectedAgents.length > 0 && !selectedAgents.includes(stat.workflowId)) {
          return false;
        }
        const time = new Date(stat.startedAt).getTime();
        return time >= range.start && time <= range.end;
      }),
    [range.end, range.start, runStats, selectedAgents]
  );

  const bucketedRuns = useMemo(
    () => bucketRunsForGranularity(filteredRuns, selectedGranularity, range),
    [filteredRuns, range, selectedGranularity]
  );

  const maxBucket = useMemo(
    () => Math.max(1, ...bucketedRuns.map((bucket) => bucket.total)),
    [bucketedRuns]
  );

  // Bucket runs by agent for multi-agent view
  const multiAgentData = useMemo(() => {
    if (!showMultiAgent) {
      return null;
    }

    // Get agents that have runs in the selected period
    // If specific agents are selected, only include those, otherwise include all
    const agentsWithRuns = agents.filter((agent) => {
      const hasRuns = runStats.some(
        (stat) =>
          stat.workflowId === agent.id &&
          new Date(stat.startedAt).getTime() >= range.start &&
          new Date(stat.startedAt).getTime() <= range.end
      );

      if (selectedAgents.length > 0) {
        return hasRuns && selectedAgents.includes(agent.id);
      }
      return hasRuns;
    });

    if (agentsWithRuns.length === 0) {
      return null;
    }

    // Create empty buckets for the time range
    const buckets: Array<{ label: string; [agentId: string]: number | string }> = [];
    let cursor = alignToBucketStart(new Date(range.start), selectedGranularity);
    const end = new Date(range.end);

    while (cursor.getTime() <= end.getTime()) {
      buckets.push({ label: formatBucketLabel(new Date(cursor), selectedGranularity) });
      cursor = nextBucketStart(cursor, selectedGranularity);
    }

    // Fill buckets with agent-specific counts
    for (const stat of runStats) {
      const time = new Date(stat.startedAt).getTime();
      if (time < range.start || time > range.end) {
        continue;
      }
      const bucketStart = alignToBucketStart(new Date(stat.startedAt), selectedGranularity);
      const bucketLabel = formatBucketLabel(bucketStart, selectedGranularity);
      const bucket = buckets.find((b) => b.label === bucketLabel);
      if (bucket) {
        const agent = agentsWithRuns.find((a) => a.id === stat.workflowId);
        if (agent) {
          bucket[agent.id] = ((bucket[agent.id] as number) || 0) + 1;
        }
      }
    }

    return {
      agents: agentsWithRuns,
      data: buckets,
    };
  }, [agents, range, runStats, selectedAgents, selectedGranularity, showMultiAgent]);

  let chartContent: ReactNode;
  if (loading) {
    chartContent = <Skeleton className="h-40 w-full rounded-md" />;
  } else if (runStats.length === 0) {
    chartContent = (
      <div className="rounded-md bg-muted/20 p-6 text-center">
        <p className="font-medium text-sm">No runs yet</p>
        <p className="text-muted-foreground text-xs">
          Execute agents to see usage.
        </p>
      </div>
    );
  } else if (bucketedRuns.length === 0) {
    chartContent = (
      <div className="rounded-md bg-muted/20 p-6 text-center">
        <p className="font-medium text-sm">No runs in this period</p>
        <p className="text-muted-foreground text-xs">
          Try widening the date range or removing filters.
        </p>
      </div>
    );
  } else if (showMultiAgent && multiAgentData) {
    // Multi-agent bar chart
    const chartHeight = 240;

    // Calculate appropriate tick interval based on number of data points
    const getMultiAgentTickInterval = () => {
      const dataPoints = multiAgentData.data.length;
      if (dataPoints <= 7) return 0; // Show all
      if (dataPoints <= 24) return "preserveStartEnd";
      if (dataPoints <= 48) return Math.floor(dataPoints / 8);
      return Math.floor(dataPoints / 10);
    };

    chartContent = (
      <div className="rounded-md bg-muted/10 p-4">
        <ResponsiveContainer height={chartHeight} width="100%">
          <BarChart
            data={multiAgentData.data}
            margin={{ top: 10, right: 16, left: 16, bottom: 20 }}
          >
            <YAxis
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
            />
            <XAxis
              axisLine={false}
              dataKey="label"
              interval={getMultiAgentTickInterval()}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (!(active && payload && payload.length)) {
                  return null;
                }
                return (
                  <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
                    <p className="mb-1 font-semibold text-sm">
                      {payload[0].payload.label}
                    </p>
                    {payload.map((entry, index) => (
                      <div
                        className="flex items-center gap-2 text-xs"
                        key={index}
                      >
                        <div
                          className="size-2 rounded-sm"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">
                          {entry.name}:
                        </span>
                        <span className="font-medium">
                          {entry.value?.toLocaleString() || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
              cursor={{ fill: "var(--muted)", opacity: 0.2 }}
            />
            <Legend
              iconType="rect"
              wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
            />
            {multiAgentData.agents.map((agent) => {
              const iconColors = getWorkflowIconColors(agent.iconColor);
              return (
                <Bar
                  dataKey={agent.id}
                  fill={iconColors.color}
                  key={agent.id}
                  name={agent.name}
                  radius={[4, 4, 0, 0]}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  } else {
    // Single agent area chart
    const chartHeight = 180;

    const chartData = bucketedRuns.map((bucket) => ({
      label: formatBucketLabel(bucket.start, selectedGranularity),
      runs: bucket.total,
    }));

    // Calculate appropriate tick interval based on number of data points
    const getTickInterval = () => {
      const dataPoints = chartData.length;
      if (dataPoints <= 7) return 0; // Show all
      if (dataPoints <= 24) return "preserveStartEnd";
      if (dataPoints <= 48) return Math.floor(dataPoints / 8);
      return Math.floor(dataPoints / 10);
    };

    chartContent = (
      <div className="rounded-md bg-muted/10 p-4">
        <ResponsiveContainer height={chartHeight} width="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 16, left: 16, bottom: 20 }}
          >
            <defs>
              <linearGradient
                id="usageGradient"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="currentColor"
                  stopOpacity={0.22}
                />
                <stop
                  offset="100%"
                  stopColor="currentColor"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <YAxis
              axisLine={false}
              domain={[0, maxBucket]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
            />
            <XAxis
              axisLine={false}
              dataKey="label"
              interval={getTickInterval()}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (!(active && payload && payload.length)) {
                  return null;
                }
                const datum = payload[0].payload as {
                  label: string;
                  runs: number;
                };
                return (
                  <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
                    <p className="font-semibold text-sm">{datum.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {datum.runs.toLocaleString()} run
                      {datum.runs === 1 ? "" : "s"}
                    </p>
                  </div>
                );
              }}
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            />
            <Area
              className="text-primary"
              dataKey="runs"
              fill="url(#usageGradient)"
              stroke="currentColor"
              strokeLinecap="butt"
              strokeLinejoin="miter"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-muted-foreground text-sm">
          Timestamped runs over your selected period and granularity.
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                {selectedAgents.length === 0 ? (
                  "All agents"
                ) : (
                  <span className="truncate">
                    {selectedAgents.length} agent{selectedAgents.length === 1 ? "" : "s"}
                  </span>
                )}
                <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]" align="start">
              {selectedAgents.length > 0 && (
                <>
                  <DropdownMenuItem
                    onClick={clearAgents}
                    className="cursor-pointer"
                  >
                    <X className="mr-2 size-4" />
                    Clear selection
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {agents.map((agent) => (
                <DropdownMenuItem
                  key={agent.id}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleAgent(agent.id);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex size-4 items-center justify-center">
                      {selectedAgents.includes(agent.id) && (
                        <Check className="size-4" />
                      )}
                    </div>
                    <span className={selectedAgents.includes(agent.id) ? "font-medium" : ""}>
                      {agent.name}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ToggleGroup
            type="single"
            value={showMultiAgent ? "split" : "combined"}
            onValueChange={(value) => {
              if (value) setShowMultiAgent(value === "split");
            }}
            className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
          >
            <ToggleGroupItem
              value="combined"
              aria-label="Combined view"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              Combined
            </ToggleGroupItem>
            <ToggleGroupItem
              value="split"
              aria-label="Split view"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              Split
            </ToggleGroupItem>
          </ToggleGroup>
          <Select
            onValueChange={(value) =>
              setSelectedGranularity(value as "hour" | "day" | "week")
            }
            value={selectedGranularity}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Granularity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Per hour</SelectItem>
              <SelectItem value="day">Per day</SelectItem>
              <SelectItem value="week">Per week</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) => setSelectedPeriod(value)}
            value={selectedPeriod}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPeriod === "custom" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                aria-label="Custom start date"
                className="h-9"
                onChange={(event) => setCustomStart(event.target.value)}
                type="date"
                value={customStart}
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                aria-label="Custom end date"
                className="h-9"
                onChange={(event) => setCustomEnd(event.target.value)}
                type="date"
                value={customEnd}
              />
            </div>
          ) : null}
        </div>
      </div>

      {chartContent}
    </div>
  );
}

function AgentsSkeleton() {
  const skeletonRows = Array.from({ length: 4 }, (_, index) => index);

  return (
    <GridTable columns={AGENT_COLUMNS} template={AGENT_GRID_TEMPLATE}>
      {skeletonRows.map((row) => (
        <GridTableRow
          className="items-center"
          key={row}
          template={AGENT_GRID_TEMPLATE}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-4 w-10" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </GridTableRow>
      ))}
    </GridTable>
  );
}

function BlocksSkeleton() {
  const skeletonRows = Array.from({ length: 4 }, (_, index) => index);

  return (
    <GridTable columns={BLOCK_COLUMNS} template={BLOCK_GRID_TEMPLATE}>
      {skeletonRows.map((row) => (
        <GridTableRow
          className="items-center"
          key={row}
          template={BLOCK_GRID_TEMPLATE}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <div className="flex justify-end">
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-4 w-32" />
        </GridTableRow>
      ))}
    </GridTable>
  );
}

export default function UsagePage() {
  const { data: session, isPending } = useSession();
  const [agents, setAgents] = useState<AgentUsage[]>([]);
  const [runStats, setRunStats] = useState<AgentRunStat[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsage = useCallback(async () => {
    try {
      setLoading(true);
      await api.team.ensureActiveTeam();
      const data = await api.usage.get();
      setAgents(data.agents);
      setRunStats(data.agentRunStats || []);
    } catch (error) {
      console.error("Failed to load usage data:", error);
      toast.error("Failed to load usage data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPending) {
      return;
    }
    if (!session?.user) {
      setLoading(false);
      return;
    }

    loadUsage();
  }, [isPending, loadUsage, session?.user]);

  const blockRows = useMemo<BlockRow[]>(() => {
    const rows: BlockRow[] = [];

    for (const agent of agents) {
      for (const block of agent.blockUsage) {
        rows.push({
          agentId: agent.id,
          agentName: agent.name,
          agentIcon: agent.icon,
          agentIconColor: agent.iconColor,
          nodeId: block.nodeId,
          nodeName: block.nodeName,
          nodeType: block.nodeType,
          runs: block.runs,
          lastUsedAt: block.lastUsedAt,
          key: `${agent.id}-${block.nodeId}-${rows.length}`,
        });
      }
    }

    return rows.sort((a, b) => {
      const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
      const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [agents]);

  const agentsWithRuns = useMemo(
    () => agents.filter((agent) => agent.totalRuns > 0).length,
    [agents]
  );
  const totalRuns = useMemo(
    () => agents.reduce((sum, agent) => sum + agent.totalRuns, 0),
    [agents]
  );

  if (isPending) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  let agentContent: ReactNode;
  if (loading) {
    agentContent = <AgentsSkeleton />;
  } else if (agents.length === 0) {
    agentContent = (
      <div className="rounded-md bg-muted/20 p-6 text-center">
        <p className="font-medium text-sm">No agents found</p>
        <p className="text-muted-foreground text-xs">
          Create a workflow to start tracking usage.
        </p>
      </div>
    );
  } else {
    agentContent = (
      <div className="overflow-x-auto">
        <GridTable columns={AGENT_COLUMNS} template={AGENT_GRID_TEMPLATE}>
          {agents
            .slice()
            .sort((a, b) => {
              const aTime = a.lastRunAt ? new Date(a.lastRunAt).getTime() : 0;
              const bTime = b.lastRunAt ? new Date(b.lastRunAt).getTime() : 0;
              return bTime - aTime;
            })
            .map((agent) => (
              <AgentRow agent={agent} key={agent.id} />
            ))}
        </GridTable>
      </div>
    );
  }

  let blockContent: ReactNode;
  if (loading) {
    blockContent = <BlocksSkeleton />;
  } else if (blockRows.length === 0) {
    blockContent = (
      <div className="rounded-md bg-muted/20 p-6 text-center">
        <p className="font-medium text-sm">No block usage recorded</p>
        <p className="text-muted-foreground text-xs">
          Run an agent to start capturing block-level activity.
        </p>
      </div>
    );
  } else {
    blockContent = (
      <div className="overflow-x-auto">
        <GridTable columns={BLOCK_COLUMNS} template={BLOCK_GRID_TEMPLATE}>
          {blockRows.map((row) => (
            <BlockUsageRow key={row.key} row={row} />
          ))}
        </GridTable>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl">Usage</h1>
          <p className="text-muted-foreground text-sm">
            Track when agents are executed and which blocks power them.
          </p>
        </div>
        <Button onClick={loadUsage} size="sm" variant="outline">
          <RefreshCw
            className={cn("mr-2 size-4", loading ? "animate-spin" : undefined)}
          />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          <SummaryCard
            helper={`${agentsWithRuns.toLocaleString()} of ${agents.length.toLocaleString()} agents have activity`}
            label="Active agents"
            value={agentsWithRuns.toLocaleString()}
          />
          <SummaryCard
            helper="Based on workflow executions across the team"
            label="Total runs"
            value={totalRuns.toLocaleString()}
          />
          <SummaryCard
            helper="Unique blocks executed across agents"
            label="Blocks used"
            value={blockRows.length.toLocaleString()}
          />
        </div>
      )}

      <Card className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Agent runs</h2>
            <p className="text-muted-foreground text-sm">
              Which agents have been executed and when they last ran.
            </p>
          </div>
        </div>

        <UsageChartSection
          agents={agents}
          loading={loading}
          runStats={runStats}
        />

        {agentContent}
      </Card>

      <Card className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Block usage</h2>
            <p className="text-muted-foreground text-sm">
              See which blocks are used within each agent.
            </p>
          </div>
        </div>

        <BlockUsageChartSection
          agents={agents}
          loading={loading}
        />

        {blockContent}
      </Card>
    </div>
  );
}
