"use client";

import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { WorkflowIcon } from "@/components/ui/workflow-icon";
import {
  getWorkflowIconColors,
  WorkflowIconDisplay,
} from "@/components/workflow/workflow-icon-options";
import { api, type SavedWorkflow } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  DEFAULT_WORKFLOW_ICON,
  DEFAULT_WORKFLOW_ICON_COLOR,
} from "@/lib/workflow-defaults";

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function WorkflowsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const filteredWorkflows = useMemo(
    () => workflows.filter((workflow) => workflow.name !== "__current__"),
    [workflows]
  );

  const loadWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.workflow.getAll();
      setWorkflows(data);
    } catch (error) {
      console.error("Failed to load workflows:", error);
      toast.error("Failed to load workflows");
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

    loadWorkflows();
  }, [isPending, loadWorkflows, session?.user]);

  // Listen for team changes and reload workflows
  useEffect(() => {
    const handleTeamChange = () => {
      loadWorkflows();
    };

    window.addEventListener("active-team-change", handleTeamChange);
    return () => {
      window.removeEventListener("active-team-change", handleTeamChange);
    };
  }, [loadWorkflows]);

  const handleCreateWorkflow = async () => {
    try {
      setCreating(true);
      const newWorkflow = await api.workflow.create({
        name: "Untitled Workflow",
        description: "",
        icon: DEFAULT_WORKFLOW_ICON,
        iconColor: DEFAULT_WORKFLOW_ICON_COLOR,
        nodes: [],
        edges: [],
      });
      router.push(`/workflows/${newWorkflow.id}`);
    } catch (error) {
      console.error("Failed to create workflow:", error);
      toast.error("Failed to create workflow");
    } finally {
      setCreating(false);
    }
  };

  let content: ReactNode;

  if (loading) {
    const skeletonCount = filteredWorkflows.length || 6;
    const skeletonKeys = Array.from(
      { length: skeletonCount },
      (_, index) => `workflow-${index}`
    );

    content = (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {skeletonKeys.map((key) => (
          <Card className="flex flex-col gap-3 p-4" key={key}>
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-20" />
            </div>
          </Card>
        ))}
      </div>
    );
  } else if (filteredWorkflows.length === 0) {
    content = (
      <Card className="border-dashed py-12 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <WorkflowIcon className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-lg">No workflows yet</p>
            <p className="text-muted-foreground text-sm">
              Create your first workflow to start automating for your team.
            </p>
          </div>
          <Button disabled={creating} onClick={handleCreateWorkflow}>
            {creating ? (
              <Spinner className="mr-2 size-4" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            Create workflow
          </Button>
        </div>
      </Card>
    );
  } else {
    content = (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredWorkflows.map((workflow) => {
          const iconColors = getWorkflowIconColors(workflow.iconColor);

          return (
            <Card className="flex flex-col gap-3 p-4" key={workflow.id}>
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-md"
                  style={{
                    color: iconColors.color,
                    backgroundColor: iconColors.backgroundColor,
                  }}
                >
                  <WorkflowIconDisplay
                    className="size-5"
                    color={iconColors.color}
                    value={workflow.icon}
                  />
                </div>
                <div>
                  <p className="font-semibold">{workflow.name}</p>
                  <p className="text-muted-foreground text-xs">
                    Updated {formatDate(workflow.updatedAt)}
                  </p>
                </div>
              </div>
              <p className="line-clamp-3 text-muted-foreground text-sm">
                {workflow.description || "No description yet."}
              </p>
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Created {formatDate(workflow.createdAt)}</span>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/workflows/${workflow.id}`}>Open</Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl">Workflows</h1>
          <p className="text-muted-foreground text-sm">
            All workflows for your active team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={loading || isPending}
            onClick={loadWorkflows}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={cn("size-4", loading ? "animate-spin" : undefined)}
            />
            Refresh
          </Button>
          <Button disabled={creating} onClick={handleCreateWorkflow} size="sm">
            {creating ? (
              <Spinner className="mr-2 size-4" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            New workflow
          </Button>
        </div>
      </div>

      {content}
    </div>
  );
}
