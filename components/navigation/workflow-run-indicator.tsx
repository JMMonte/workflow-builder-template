"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  currentWorkflowIdAtom,
  currentWorkflowNameAtom,
  isExecutingAtom,
  propertiesPanelActiveTabAtom,
} from "@/lib/workflow-store";

export function WorkflowRunIndicator() {
  const isExecuting = useAtomValue(isExecutingAtom);
  const workflowId = useAtomValue(currentWorkflowIdAtom);
  const workflowName = useAtomValue(currentWorkflowNameAtom);
  const setActiveTab = useSetAtom(propertiesPanelActiveTabAtom);
  const router = useRouter();

  if (!isExecuting) {
    return null;
  }

  const handleViewRun = () => {
    if (!workflowId) {
      return;
    }
    setActiveTab("runs");
    router.push(`/workflows/${workflowId}`);
  };

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border bg-background/95 px-3 py-2 shadow-lg ring-1 ring-border backdrop-blur">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Loader2 className="size-4 animate-spin" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight">
            Workflow running
          </p>
          <p className="truncate text-muted-foreground text-xs">
            {workflowName || "Current workflow"}
          </p>
        </div>
        {workflowId ? (
          <Button onClick={handleViewRun} size="sm" variant="secondary">
            View run
          </Button>
        ) : null}
      </div>
    </div>
  );
}
