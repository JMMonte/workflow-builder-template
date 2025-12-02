"use client";

import type { NodeProps } from "@xyflow/react";
import { useAtomValue } from "jotai";
import {
  AlertTriangle,
  Check,
  Code,
  Database,
  EyeOff,
  FileText,
  GitBranch,
  Image as ImageIcon,
  XCircle,
  Zap,
} from "lucide-react";
import NextImage from "next/image";
import { memo, useState } from "react";
import {
  Node,
  NodeDescription,
  NodeTitle,
} from "@/components/ai-elements/node";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { IntegrationIcon } from "@/components/ui/integration-icon";
import { cn } from "@/lib/utils";
import {
  executionLogsAtom,
  selectedExecutionIdAtom,
  type WorkflowNodeData,
} from "@/lib/workflow-store";

// Helper to get display name for AI model
const getModelDisplayName = (modelId: string): string => {
  const modelNames: Record<string, string> = {
    "gpt-5": "GPT-5",
    "openai/gpt-5.1-instant": "GPT-5.1 Instant",
    "openai/gpt-5.1-codex": "GPT-5.1 Codex",
    "openai/gpt-5.1-codex-mini": "GPT-5.1 Codex Mini",
    "openai/gpt-5.1-thinking": "GPT-5.1 Thinking",
    "gpt-4": "GPT-4",
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    "claude-3-5-sonnet": "Claude 3.5",
    "claude-3-opus": "Claude 3 Opus",
    "anthropic/claude-opus-4.5": "Claude Opus 4.5",
    "anthropic/claude-sonnet-4.5": "Claude Sonnet 4.5",
    "anthropic/claude-haiku-4.5": "Claude Haiku 4.5",
    "google/gemini-3-pro-preview": "Gemini 3 Pro Preview",
    "google/gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
    "google/gemini-2.5-flash": "Gemini 2.5 Flash",
    "google/gemini-2.5-pro": "Gemini 2.5 Pro",
    "meta/llama-4-scout": "Llama 4 Scout",
    "meta/llama-3.3-70b": "Llama 3.3 70B",
    "meta/llama-3.1-8b": "Llama 3.1 8B",
    "moonshotai/kimi-k2-0905": "Kimi K2",
    "openai/gpt-oss-120b": "GPT OSS 120B",
    "openai/gpt-oss-safeguard-20b": "GPT OSS Safeguard 20B",
    "openai/gpt-oss-20b": "GPT OSS 20B",
    "o1-preview": "o1 Preview",
    "o1-mini": "o1 Mini",
    "bfl/flux-2-pro": "FLUX.2 Pro",
    "bfl/flux-1-pro": "FLUX.1 Pro",
    "openai/dall-e-3": "DALL-E 3",
    "google/imagen-4.0-generate": "Imagen 4.0",
  };
  return modelNames[modelId] || modelId;
};

// Helper to get integration name from action type
const getIntegrationFromActionType = (actionType: string): string => {
  const integrationMap: Record<string, string> = {
    "Send Email": "Resend",
    "Send Slack Message": "Slack",
    "Create Ticket": "Linear",
    "Find Issues": "Linear",
    "Send Gmail": "Google",
    "Read Gmail": "Google",
    "Create Google Calendar Event": "Google",
    "List Google Calendar Events": "Google",
    "Upload Drive File": "Google",
    "Search Drive": "Google",
    "Send Outlook Email": "Microsoft",
    "Read Outlook Email": "Microsoft",
    "Create Teams Message": "Microsoft",
    "Upload OneDrive File": "Microsoft",
    "Search OneDrive": "Microsoft",
    "Create SharePoint Page": "Microsoft",
    "Create Microsoft Event": "Microsoft",
    "List Microsoft Events": "Microsoft",
    "HTTP Request": "System",
    "Database Query": "Database",
    "Generate Text": "AI Gateway",
    "Generate Image": "AI Gateway",
    "Content Card": "Content Card",
    Scrape: "Firecrawl",
    Search: "Firecrawl",
    Condition: "Condition",
  };
  return integrationMap[actionType] || "System";
};

// Helper to detect if output is a base64 image from generateImage step
function isBase64ImageOutput(output: unknown): output is { base64: string } {
  return (
    typeof output === "object" &&
    output !== null &&
    "base64" in output &&
    typeof (output as { base64: unknown }).base64 === "string" &&
    (output as { base64: string }).base64.length > 100
  );
}

// Helper to check if an action requires an integration
const requiresIntegration = (actionType: string): boolean => {
  const requiresIntegrationActions = [
    "Send Email",
    "Send Slack Message",
    "Create Ticket",
    "Find Issues",
    "Generate Text",
    "Generate Image",
    "Database Query",
    "Scrape",
    "Search",
    "Send Gmail",
    "Create Google Calendar Event",
    "Upload Drive File",
    "Send Outlook Email",
    "Create Teams Message",
    "Upload OneDrive File",
    "Create SharePoint Page",
    "Create Microsoft Event",
  ];
  return requiresIntegrationActions.includes(actionType);
};

// Helper to check if integration is configured
// Now checks for integrationId in node config
const hasIntegrationConfigured = (config: Record<string, unknown>): boolean =>
  Boolean(config?.integrationId);

// Helper to get provider logo for action type
const getProviderLogo = (
  actionType: string,
  options?: { cardType?: string }
) => {
  const cardType = options?.cardType;

  switch (actionType) {
    case "Send Email":
      return <IntegrationIcon className="size-12" integration="resend" />;
    case "Send Slack Message":
      return <IntegrationIcon className="size-12" integration="slack" />;
    case "Create Ticket":
    case "Find Issues":
      return <IntegrationIcon className="size-12" integration="linear" />;
    case "HTTP Request":
      return <Zap className="size-12 text-amber-300" strokeWidth={1.5} />;
    case "Database Query":
      return <Database className="size-12 text-blue-300" strokeWidth={1.5} />;
    case "Generate Text":
    case "Generate Image":
      return <IntegrationIcon className="size-12" integration="vercel" />;
    case "Send Gmail":
    case "Read Gmail":
    case "Create Google Calendar Event":
    case "List Google Calendar Events":
    case "Upload Drive File":
    case "Search Drive":
      return <IntegrationIcon className="size-12" integration="google" />;
    case "Send Outlook Email":
    case "Read Outlook Email":
    case "Create Teams Message":
    case "Upload OneDrive File":
    case "Search OneDrive":
    case "Create SharePoint Page":
    case "Create Microsoft Event":
    case "List Microsoft Events":
      return <IntegrationIcon className="size-12" integration="microsoft" />;
    case "Content Card":
      return cardType === "image" ? (
        <ImageIcon className="size-12 text-blue-300" strokeWidth={1.5} />
      ) : (
        <FileText className="size-12 text-amber-300" strokeWidth={1.5} />
      );
    case "Scrape":
    case "Search":
      return <IntegrationIcon className="size-12" integration="firecrawl" />;
    case "Execute Code":
      return <Code className="size-12 text-green-300" strokeWidth={1.5} />;
    case "Condition":
      return <GitBranch className="size-12 text-pink-300" strokeWidth={1.5} />;
    default:
      return <Zap className="size-12 text-amber-300" strokeWidth={1.5} />;
  }
};

const TEMPLATE_REF_REGEX = /\{\{.*\}\}/;

// Status badge component
const StatusBadge = ({
  status,
}: {
  status?: "idle" | "running" | "success" | "error";
}) => {
  // Don't show badge for idle or running (running has BorderBeam animation)
  if (!status || status === "idle" || status === "running") {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute top-2 right-2 rounded-full p-1",
        status === "success" && "bg-green-500/50",
        status === "error" && "bg-red-500/50"
      )}
    >
      {status === "success" && (
        <Check className="size-3.5 text-white" strokeWidth={2.5} />
      )}
      {status === "error" && (
        <XCircle className="size-3.5 text-white" strokeWidth={2.5} />
      )}
    </div>
  );
};

// Model badge component for AI nodes
const ModelBadge = ({ model }: { model: string }) => {
  if (!model) {
    return null;
  }

  return (
    <div className="rounded-full border border-muted-foreground/50 px-2 py-0.5 font-medium text-[10px] text-muted-foreground">
      {getModelDisplayName(model)}
    </div>
  );
};

// Generated image thumbnail with zoom dialog
function GeneratedImageThumbnail({ base64 }: { base64: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button
        className="relative h-24 w-full cursor-zoom-in overflow-hidden rounded-lg transition-transform hover:scale-105"
        onClick={(e) => {
          e.stopPropagation();
          setDialogOpen(true);
        }}
        type="button"
      >
        <NextImage
          alt="Generated image"
          className="object-cover"
          fill
          sizes="48px"
          src={`data:image/png;base64,${base64}`}
          unoptimized
        />
      </button>

      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogContent className="max-w-3xl p-2" showCloseButton={false}>
          <DialogTitle className="sr-only">Generated Image</DialogTitle>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg">
            <NextImage
              alt="Generated image"
              className="object-contain"
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              src={`data:image/png;base64,${base64}`}
              unoptimized
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Preview image stored on the node config (e.g., uploaded content card)
function ConfigImageThumbnail({ src }: { src: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button
        className="relative h-24 w-full cursor-zoom-in overflow-hidden rounded-lg transition-transform hover:scale-105"
        onClick={(e) => {
          e.stopPropagation();
          setDialogOpen(true);
        }}
        type="button"
      >
        <NextImage
          alt="Card image"
          className="object-cover"
          fill
          sizes="48px"
          src={src}
          unoptimized
        />
      </button>

      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogContent className="max-w-3xl p-2" showCloseButton={false}>
          <DialogTitle className="sr-only">Card Image</DialogTitle>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg">
            <NextImage
              alt="Card image"
              className="object-contain"
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              src={src}
              unoptimized
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type ActionNodeProps = NodeProps & {
  data?: WorkflowNodeData;
  id: string;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex UI logic with multiple conditions including disabled state
export const ActionNode = memo(({ data, selected, id }: ActionNodeProps) => {
  const selectedExecutionId = useAtomValue(selectedExecutionIdAtom);
  const executionLogs = useAtomValue(executionLogsAtom);

  if (!data) {
    return null;
  }

  const actionType = (data.config?.actionType as string) || "";
  const status = data.status;
  const rawCardType = (data.config?.cardType as string) || "";
  const cardType =
    rawCardType ||
    (data.config?.imageBase64 || data.config?.imageUrl ? "image" : undefined) ||
    (actionType === "Content Card" ? "text" : undefined);
  const contentCardImage = (() => {
    if (!(actionType === "Content Card" && cardType === "image")) {
      return null;
    }

    const imageBase64 = (data.config?.imageBase64 as string) || "";
    const imageUrl = (data.config?.imageUrl as string) || "";

    if (imageBase64 && !TEMPLATE_REF_REGEX.test(imageBase64)) {
      return imageBase64.startsWith("data:")
        ? imageBase64
        : `data:image/png;base64,${imageBase64}`;
    }

    if (imageUrl && !TEMPLATE_REF_REGEX.test(imageUrl)) {
      return imageUrl;
    }

    return null;
  })();
  let defaultDescription = getIntegrationFromActionType(actionType);
  if (actionType === "Content Card") {
    defaultDescription =
      cardType === "image" || contentCardImage ? "Image card" : "Text card";
  }

  // Check if this node has a generated image from the selected execution
  const nodeLog = executionLogs[id];
  const hasGeneratedImage =
    selectedExecutionId &&
    actionType === "Generate Image" &&
    nodeLog?.output &&
    isBase64ImageOutput(nodeLog.output);

  // Handle empty action type (new node without selected action)
  if (!actionType) {
    const isDisabled = data.enabled === false;
    return (
      <Node
        className={cn(
          "flex h-48 w-48 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
          selected && "border-primary",
          isDisabled && "opacity-50"
        )}
        handles={{ target: true, source: true }}
        status={status}
      >
        {isDisabled && (
          <div className="absolute top-2 left-2 rounded-full bg-gray-500/50 p-1">
            <EyeOff className="size-3.5 text-white" />
          </div>
        )}
        <div className="flex flex-col items-center justify-center gap-3 p-6">
          <Zap className="size-12 text-muted-foreground" strokeWidth={1.5} />
          <div className="flex flex-col items-center gap-1 text-center">
            <NodeTitle className="text-base">
              {data.label || "Action"}
            </NodeTitle>
            <NodeDescription className="text-xs">
              Select an action
            </NodeDescription>
          </div>
        </div>
      </Node>
    );
  }

  const displayTitle = data.label || actionType;
  const displayDescription = data.description || defaultDescription;

  const needsIntegration = requiresIntegration(actionType);
  const integrationMissing =
    needsIntegration && !hasIntegrationConfigured(data.config || {});

  // Get model for AI nodes
  const getAiModel = (): string | null => {
    if (actionType === "Generate Text") {
      return (data.config?.aiModel as string) || "meta/llama-4-scout";
    }
    if (actionType === "Generate Image") {
      return (
        (data.config?.imageModel as string) || "google/imagen-4.0-generate"
      );
    }
    return null;
  };

  const aiModel = getAiModel();
  const isDisabled = data.enabled === false;
  let primaryVisual: React.ReactNode;

  if (hasGeneratedImage) {
    primaryVisual = (
      <GeneratedImageThumbnail
        base64={(nodeLog.output as { base64: string }).base64}
      />
    );
  } else if (contentCardImage) {
    primaryVisual = <ConfigImageThumbnail src={contentCardImage} />;
  } else {
    primaryVisual = getProviderLogo(actionType, { cardType });
  }

  return (
    <Node
      className={cn(
        "relative flex h-48 w-48 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        selected && "border-primary",
        isDisabled && "opacity-50"
      )}
      handles={{ target: true, source: true }}
      status={status}
    >
      {/* Disabled badge in top left */}
      {isDisabled && (
        <div className="absolute top-2 left-2 rounded-full bg-gray-500/50 p-1">
          <EyeOff className="size-3.5 text-white" />
        </div>
      )}

      {/* Integration warning badge in top left (only if not disabled) */}
      {!isDisabled && integrationMissing && (
        <div className="absolute top-2 left-2 rounded-full bg-orange-500/50 p-1">
          <AlertTriangle className="size-3.5 text-white" />
        </div>
      )}

      {/* Status indicator badge in top right */}
      <StatusBadge status={status} />

      <div className="flex w-full flex-col items-center justify-center gap-3 p-4">
        {primaryVisual}
        <div className="flex flex-col items-center gap-1 text-center">
          <NodeTitle className="text-base">{displayTitle}</NodeTitle>
          {displayDescription && (
            <NodeDescription className="text-xs">
              {displayDescription}
            </NodeDescription>
          )}
          {/* Model badge for AI nodes */}
          {aiModel && <ModelBadge model={aiModel} />}
        </div>
      </div>
    </Node>
  );
});

ActionNode.displayName = "ActionNode";
