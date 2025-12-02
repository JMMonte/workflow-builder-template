"use client";

import { CheckCircle2, CircleAlert, Pencil, Trash2 } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GridTable,
  type GridTableColumn,
  GridTableRow,
} from "@/components/ui/grid-table";
import { IntegrationIcon } from "@/components/ui/integration-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { api, type Integration, type IntegrationType } from "@/lib/api-client";
import { IntegrationFormDialog } from "./integration-form-dialog";

const INTEGRATION_TYPE_LABELS: Record<IntegrationType, string> = {
  resend: "Resend",
  linear: "Linear",
  slack: "Slack",
  database: "Database",
  "ai-gateway": "AI Gateway",
  google: "Google Workspace",
  microsoft: "Microsoft 365",
  firecrawl: "Firecrawl",
  custom: "Custom",
};

const INTEGRATION_GRID_TEMPLATE =
  "grid-cols-[minmax(220px,2fr)_minmax(160px,1fr)_minmax(220px,1.2fr)]";

const INTEGRATION_COLUMNS: GridTableColumn[] = [
  { id: "integration", label: "Integration" },
  { id: "type", label: "Type" },
  { id: "actions", label: "Actions", align: "right" },
];

type IntegrationsManagerProps = {
  showCreateDialog: boolean;
  onShowCreateDialogChange?: (open: boolean) => void;
};

type IntegrationRowProps = {
  integration: Integration;
  isTestable: boolean;
  onTest: () => void;
  onEdit: () => void;
  onDelete: () => void;
  testing: boolean;
};

type TestPreviewState = {
  integrationName: string;
  integrationType?: IntegrationType;
  response: Awaited<ReturnType<typeof api.integration.testConnection>>;
};

function IntegrationRow({
  integration,
  isTestable,
  onTest,
  onEdit,
  onDelete,
  testing,
}: IntegrationRowProps) {
  return (
    <GridTableRow template={INTEGRATION_GRID_TEMPLATE}>
      <div className="flex items-center gap-3">
        <IntegrationIcon
          className="size-8"
          integration={
            integration.type === "ai-gateway" ? "vercel" : integration.type
          }
        />
        <p className="font-medium text-sm">{integration.name}</p>
      </div>
      <p className="text-muted-foreground text-sm">
        {INTEGRATION_TYPE_LABELS[integration.type]}
      </p>
      <div className="flex items-center justify-end gap-2">
        {isTestable ? (
          <Button
            disabled={testing}
            onClick={onTest}
            size="sm"
            variant="outline"
          >
            {testing ? <Spinner className="size-4" /> : "Test"}
          </Button>
        ) : (
          <Button disabled size="sm" variant="outline">
            No test
          </Button>
        )}
        <Button onClick={onEdit} size="sm" variant="outline">
          <Pencil className="size-4" />
        </Button>
        <Button onClick={onDelete} size="sm" variant="outline">
          <Trash2 className="size-4" />
        </Button>
      </div>
    </GridTableRow>
  );
}

export function IntegrationsManager({
  showCreateDialog: externalShowCreateDialog,
  onShowCreateDialogChange,
}: IntegrationsManagerProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIntegration, setEditingIntegration] =
    useState<Integration | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testPreview, setTestPreview] = useState<TestPreviewState | null>(null);

  // Sync external dialog state
  useEffect(() => {
    setShowCreateDialog(externalShowCreateDialog);
  }, [externalShowCreateDialog]);

  const loadIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.integration.getAll();
      setIntegrations(data);
    } catch (error) {
      console.error("Failed to load integrations:", error);
      toast.error("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  // Listen for team changes and reload integrations
  useEffect(() => {
    const handleTeamChange = () => {
      loadIntegrations();
    };

    window.addEventListener("active-team-change", handleTeamChange);
    return () => {
      window.removeEventListener("active-team-change", handleTeamChange);
    };
  }, [loadIntegrations]);

  const handleDelete = async (id: string) => {
    try {
      await api.integration.delete(id);
      toast.success("Integration deleted");
      await loadIntegrations();
    } catch (error) {
      console.error("Failed to delete integration:", error);
      toast.error("Failed to delete integration");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTest = async (id: string) => {
    const integration = integrations.find(
      (currentIntegration) => currentIntegration.id === id
    );

    try {
      setTestingId(id);
      const result = await api.integration.testConnection(id);

      if (result.status === "success") {
        toast.success(result.message || "Connection successful");
      } else {
        toast.error(result.message || "Connection test failed");
      }

      setTestPreview({
        integrationName: integration?.name ?? "Integration",
        integrationType: integration?.type,
        response: result,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Connection test failed";
      console.error("Connection test failed:", error);
      toast.error(errorMessage);
      setTestPreview({
        integrationName: integration?.name ?? "Integration",
        integrationType: integration?.type,
        response: { status: "error", message: errorMessage },
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleDialogClose = () => {
    setShowCreateDialog(false);
    setEditingIntegration(null);
    onShowCreateDialogChange?.(false);
  };

  const handleDialogSuccess = async () => {
    await loadIntegrations();
  };

  const skeletonRows = Array.from(
    { length: 4 },
    (_, index) => `integration-skeleton-${index}`
  );

  let tableContent: ReactNode = null;

  if (loading) {
    tableContent = (
      <GridTable
        columns={[
          { id: "integration", label: <Skeleton className="h-4 w-24" /> },
          { id: "type", label: <Skeleton className="h-4 w-12" /> },
          {
            id: "actions",
            label: (
              <div className="flex justify-end">
                <Skeleton className="h-4 w-20" />
              </div>
            ),
            align: "right",
          },
        ]}
        template={INTEGRATION_GRID_TEMPLATE}
      >
        {skeletonRows.map((rowKey) => (
          <GridTableRow
            className="items-center"
            key={rowKey}
            template={INTEGRATION_GRID_TEMPLATE}
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-4 w-16" />
            <div className="flex items-center justify-end gap-2">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-9 rounded-md" />
              <Skeleton className="h-8 w-9 rounded-md" />
            </div>
          </GridTableRow>
        ))}
      </GridTable>
    );
  } else if (integrations.length === 0) {
    tableContent = (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          No integrations configured yet
        </p>
      </div>
    );
  } else {
    tableContent = (
      <GridTable
        columns={INTEGRATION_COLUMNS}
        template={INTEGRATION_GRID_TEMPLATE}
      >
        {integrations.map((integration) => {
          const isTestable = integration.type !== "custom";

          return (
            <IntegrationRow
              integration={integration}
              isTestable={isTestable}
              key={integration.id}
              onDelete={() => setDeletingId(integration.id)}
              onEdit={() => setEditingIntegration(integration)}
              onTest={() => handleTest(integration.id)}
              testing={testingId === integration.id}
            />
          );
        })}
      </GridTable>
    );
  }

  return (
    <div className="space-y-4">
      {tableContent}

      {(showCreateDialog || editingIntegration) && (
        <IntegrationFormDialog
          integration={editingIntegration}
          mode={editingIntegration ? "edit" : "create"}
          onClose={handleDialogClose}
          onSuccess={handleDialogSuccess}
          open
        />
      )}

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setDeletingId(null);
          }
        }}
        open={deletingId !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Integration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this integration? Workflows using
              this integration will fail until a new one is selected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  handleDelete(deletingId);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TestResponsePreview
        onClose={() => setTestPreview(null)}
        preview={testPreview}
      />
    </div>
  );
}

type TestResponsePreviewProps = {
  preview: TestPreviewState | null;
  onClose: () => void;
};

function TestResponsePreview({ preview, onClose }: TestResponsePreviewProps) {
  if (!preview) {
    return null;
  }

  const isSuccess = preview.response.status === "success";

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Test response</DialogTitle>
          <DialogDescription>
            {preview.integrationName}
            {preview.integrationType
              ? ` · ${INTEGRATION_TYPE_LABELS[preview.integrationType]}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant={isSuccess ? "default" : "destructive"}>
            {isSuccess ? (
              <CheckCircle2 className="mt-0.5 size-4 text-green-500" />
            ) : (
              <CircleAlert className="mt-0.5 size-4 text-destructive" />
            )}
            <AlertTitle className="capitalize">
              {preview.response.status}
            </AlertTitle>
            <AlertDescription>
              <p className="text-muted-foreground text-sm">
                {preview.response.message || "No message returned"}
              </p>
            </AlertDescription>
          </Alert>

          <div className="rounded-md border bg-muted/40 p-3">
            <p className="font-medium text-muted-foreground text-xs">
              Raw response
            </p>
            <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-background p-3 font-mono text-xs leading-relaxed">
              {JSON.stringify(preview.response, null, 2)}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
