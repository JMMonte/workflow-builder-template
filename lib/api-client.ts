/**
 * API Client for making type-safe API calls to the backend
 * Replaces server actions with API endpoints
 */

import type { WorkflowRun, WorkflowRunLog } from "./workflow-run";
import type {
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeData,
} from "./workflow-store";

export const TEAM_STORAGE_KEY = "activeTeamId";

function getStoredTeamId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TEAM_STORAGE_KEY);
}

// Workflow data types
export type WorkflowData = {
  id?: string;
  name?: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  teamId?: string;
  assistantMessage?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type SavedWorkflow = WorkflowData & {
  id: string;
  name: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
  icon: string;
  iconColor: string;
};

// API error class
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// Helper function to make API calls
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit,
  opts: { allowRetry?: boolean } = { allowRetry: true }
): Promise<T> {
  const headers = new Headers(options?.headers || {});
  headers.set("Content-Type", "application/json");

  const teamId = getStoredTeamId();
  if (teamId && !headers.has("x-team-id")) {
    headers.set("x-team-id", teamId);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));

    const message = error.error || "Request failed";

    // If the request failed due to an invalid team, clear the stored team and retry once
    if (
      response.status === 403 &&
      typeof window !== "undefined" &&
      opts.allowRetry
    ) {
      const storedTeamId = getStoredTeamId();
      const teamAccessError =
        message.toLowerCase().includes("do not have access") ||
        message.toLowerCase().includes("team");

      if (storedTeamId && teamAccessError) {
        window.localStorage.removeItem(TEAM_STORAGE_KEY);
        window.dispatchEvent(new Event("active-team-change"));
        return apiCall<T>(endpoint, options, { allowRetry: false });
      }
    }

    throw new ApiError(response.status, message);
  }

  return response.json();
}

// AI API

type StreamMessage = {
  type: "operation" | "complete" | "error";
  operation?: {
    op:
      | "setName"
      | "setDescription"
      | "addNode"
      | "addEdge"
      | "removeNode"
      | "removeEdge"
      | "updateNode"
      | "setAssistantMessage";
    name?: string;
    description?: string;
    node?: unknown;
    edge?: unknown;
    nodeId?: string;
    edgeId?: string;
    message?: string;
    updates?: {
      position?: { x: number; y: number };
      data?: unknown;
    };
  };
  error?: string;
};

type StreamState = {
  buffer: string;
  currentData: WorkflowData;
};

export type GatewayModelPricing = {
  input?: number;
  output?: number;
  cachedInputTokens?: number;
  cacheCreationInputTokens?: number;
};

export type GatewayModel = {
  id: string;
  name?: string;
  description?: string;
  modelType?: string;
  pricing?: GatewayModelPricing;
};

export type GatewayModelsResponse = {
  models: GatewayModel[];
};

type OperationHandler = (
  op: StreamMessage["operation"],
  state: StreamState
) => void;

const JSON_STRING_CONFIG_KEYS = new Set([
  "httpHeaders",
  "httpBody",
  "webhookMockRequest",
  "webhookSchema",
  "dbSchema",
  "aiSchema",
]);

const STRING_CONFIG_KEYS = new Set(["dbQuery"]);

function normalizeConfigValue(key: string, value: unknown): unknown {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value === "string") {
    return value;
  }

  if (JSON_STRING_CONFIG_KEYS.has(key)) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  if (STRING_CONFIG_KEYS.has(key)) {
    return String(value);
  }

  return value;
}

function sanitizeConfig(
  config?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!config) {
    return config;
  }

  let changed = false;
  const next: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    const normalized = normalizeConfigValue(key, value);
    next[key] = normalized;
    if (normalized !== value) {
      changed = true;
    }
  }

  return changed ? next : config;
}

function mergeConfigs(
  existingConfig?: Record<string, unknown>,
  updates?: unknown
): Record<string, unknown> | undefined {
  if (updates === undefined) {
    return existingConfig;
  }

  if (!updates || typeof updates !== "object") {
    return existingConfig;
  }

  const base =
    existingConfig && typeof existingConfig === "object" ? existingConfig : {};

  return {
    ...base,
    ...(updates as Record<string, unknown>),
  };
}

function mergeNodeData(
  existingData: WorkflowNodeData | undefined,
  updates?: WorkflowNodeData
): WorkflowNodeData | undefined {
  if (!updates || typeof updates !== "object") {
    return existingData;
  }

  const mergedConfig =
    updates.config !== undefined
      ? mergeConfigs(
          existingData?.config as Record<string, unknown> | undefined,
          updates.config
        )
      : existingData?.config;

  const mergedData = {
    ...existingData,
    ...updates,
    ...(updates.config !== undefined ? { config: mergedConfig } : {}),
  };

  const sanitizedConfig = sanitizeConfig(
    mergedData.config as Record<string, unknown> | undefined
  );

  return sanitizedConfig === mergedData.config
    ? mergedData
    : { ...mergedData, config: sanitizedConfig };
}

function sanitizeNodeData(
  data: WorkflowNodeData | undefined
): WorkflowNodeData | undefined {
  if (!data) {
    return data;
  }

  const sanitizedConfig = sanitizeConfig(
    data.config as Record<string, unknown> | undefined
  );

  if (sanitizedConfig === data.config) {
    return data;
  }

  return { ...data, config: sanitizedConfig };
}

function sanitizeNode(node: WorkflowNode): WorkflowNode {
  const sanitizedData = sanitizeNodeData(node.data);
  return sanitizedData === node.data
    ? node
    : { ...node, data: sanitizedData ?? node.data };
}

function handleSetName(
  op: StreamMessage["operation"],
  state: StreamState
): void {
  if (op?.name) {
    state.currentData.name = op.name;
  }
}

function handleSetDescription(
  op: StreamMessage["operation"],
  state: StreamState
): void {
  if (op?.description) {
    state.currentData.description = op.description;
  }
}

function handleAddNode(
  op: StreamMessage["operation"],
  state: StreamState
): void {
  if (op?.node) {
    const node = sanitizeNode(op.node as WorkflowNode);
    state.currentData.nodes = [...state.currentData.nodes, node];
  }
}

function handleAddEdge(
  op: StreamMessage["operation"],
  state: StreamState
): void {
  if (op?.edge) {
    state.currentData.edges = [
      ...state.currentData.edges,
      op.edge as WorkflowEdge,
    ];
  }
}

function handleRemoveNode(
  op: StreamMessage["operation"],
  state: StreamState
): void {
  if (op?.nodeId) {
    state.currentData.nodes = state.currentData.nodes.filter(
      (n) => n.id !== op.nodeId
    );
    state.currentData.edges = state.currentData.edges.filter(
      (e) => e.source !== op.nodeId && e.target !== op.nodeId
    );
  }
}

function handleRemoveEdge(
  op: StreamMessage["operation"],
  state: StreamState
): void {
  if (op?.edgeId) {
    state.currentData.edges = state.currentData.edges.filter(
      (e) => e.id !== op.edgeId
    );
  }
}

function handleUpdateNode(
  op: StreamMessage["operation"],
  state: StreamState
): void {
  if (op?.nodeId && op.updates) {
    state.currentData.nodes = state.currentData.nodes.map((n) => {
      if (n.id === op.nodeId) {
        const updatesData = op.updates?.data as WorkflowNodeData | undefined;

        return {
          ...n,
          ...(op.updates?.position ? { position: op.updates.position } : {}),
          ...(updatesData ? { data: mergeNodeData(n.data, updatesData) } : {}),
        };
      }
      return n;
    });
  }
}

function handleSetAssistantMessage(
  op: StreamMessage["operation"],
  state: StreamState
): void {
  if (typeof op?.message === "string") {
    state.currentData.assistantMessage = op.message;
  }
}

const operationHandlers: Record<string, OperationHandler> = {
  setName: handleSetName,
  setDescription: handleSetDescription,
  addNode: handleAddNode,
  addEdge: handleAddEdge,
  removeNode: handleRemoveNode,
  removeEdge: handleRemoveEdge,
  updateNode: handleUpdateNode,
  setAssistantMessage: handleSetAssistantMessage,
};

function applyOperation(
  op: StreamMessage["operation"],
  state: StreamState
): void {
  if (!op?.op) {
    return;
  }

  const handler = operationHandlers[op.op];
  if (handler) {
    handler(op, state);
  }
}

function processStreamLine(
  line: string,
  onUpdate: (data: WorkflowData) => void,
  state: StreamState
): void {
  if (!line.trim()) {
    return;
  }

  try {
    const message = JSON.parse(line) as StreamMessage;

    if (message.type === "operation" && message.operation) {
      applyOperation(message.operation, state);
      onUpdate({ ...state.currentData });
    } else if (message.type === "error") {
      console.error("[API Client] Error:", message.error);
      throw new Error(message.error);
    }
  } catch (error) {
    console.error("[API Client] Failed to parse JSONL line:", error);
  }
}

function processStreamChunk(
  value: Uint8Array,
  decoder: TextDecoder,
  onUpdate: (data: WorkflowData) => void,
  state: StreamState
): void {
  state.buffer += decoder.decode(value, { stream: true });

  // Process complete JSONL lines
  const lines = state.buffer.split("\n");
  state.buffer = lines.pop() || "";

  for (const line of lines) {
    processStreamLine(line, onUpdate, state);
  }
}

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export const aiApi = {
  generate: (
    prompt: string,
    existingWorkflow?: {
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
      name?: string;
      assistantMessage?: string;
    }
  ) =>
    apiCall<WorkflowData>("/api/ai/generate", {
      method: "POST",
      body: JSON.stringify({ prompt, existingWorkflow }),
    }),
  generateStream: async (
    prompt: string,
    conversationHistory: ConversationMessage[],
    onUpdate: (data: WorkflowData) => void,
    existingWorkflow?: {
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
      name?: string;
      assistantMessage?: string;
    }
  ): Promise<WorkflowData> => {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, conversationHistory, existingWorkflow }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const state: StreamState = {
      buffer: "",
      currentData: existingWorkflow
        ? {
            nodes: existingWorkflow.nodes || [],
            edges: existingWorkflow.edges || [],
            name: existingWorkflow.name,
            assistantMessage: existingWorkflow.assistantMessage,
          }
        : { nodes: [], edges: [], assistantMessage: undefined },
    };

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        processStreamChunk(value, decoder, onUpdate, state);
      }

      return state.currentData;
    } finally {
      reader.releaseLock();
    }
  },
  getAvailableModels: (integrationId?: string) =>
    apiCall<GatewayModelsResponse>(
      `/api/ai/models${
        integrationId
          ? `?integrationId=${encodeURIComponent(integrationId)}`
          : ""
      }`
    ),
};

// Integration types
export type IntegrationType =
  | "resend"
  | "linear"
  | "slack"
  | "database"
  | "ai-gateway"
  | "firecrawl"
  | "custom";

export type CustomIntegrationField = {
  key: string;
  value: string;
  label?: string;
  secret?: boolean;
};

export type IntegrationConfig = {
  apiKey?: string;
  fromEmail?: string;
  teamId?: string;
  url?: string;
  openaiApiKey?: string;
  firecrawlApiKey?: string;
  customFields?: CustomIntegrationField[];
};

export type Integration = {
  id: string;
  teamId: string;
  name: string;
  type: IntegrationType;
  createdAt: string;
  updatedAt: string;
};

export type IntegrationWithConfig = Integration & {
  config: IntegrationConfig;
};

// Team types
export type Team = {
  id: string;
  name: string;
  imageUrl: string | null;
  icon: string | null;
  iconColor: string | null;
  role: "owner" | "member";
  createdAt: string;
  updatedAt: string;
};

export type TeamInput = {
  name: string;
  icon?: string | null;
  iconColor?: string | null;
  imageUrl?: string | null;
};

export type TeamUpdateInput = Partial<TeamInput>;

export type TeamMember = {
  id: string;
  teamId: string;
  userId: string;
  role: "owner" | "member";
  name: string | null;
  email: string | null;
  createdAt: string;
};

export type TeamMemberRow = TeamMember & { type: "member" };

export type TeamInvite = {
  id: string;
  teamId: string;
  email: string;
  status: "pending" | "accepted" | "cancelled" | "expired";
  invitedBy: string;
  acceptedUserId: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
};

export type InviteDetails = TeamInvite & { teamName: string };
export type AcceptInviteResponse = {
  status: "accepted" | "already-member";
  teamId: string;
  teamName: string;
  email: string;
};

export type TeamInviteRow = TeamInvite & { type: "invite" };

export type TeamMemberOrInvite = TeamMemberRow | TeamInviteRow;

export type AddTeamMemberResponse =
  | { status: "member"; member: TeamMember }
  | { status: "invited"; invite: TeamInvite };

// Integration API
export const integrationApi = {
  // List all integrations
  getAll: (type?: IntegrationType) =>
    apiCall<Integration[]>(`/api/integrations${type ? `?type=${type}` : ""}`),

  // Get single integration with config
  get: (id: string) =>
    apiCall<IntegrationWithConfig>(`/api/integrations/${id}`),

  // Create integration
  create: (data: {
    name: string;
    type: IntegrationType;
    config: IntegrationConfig;
  }) =>
    apiCall<Integration>("/api/integrations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update integration
  update: (id: string, data: { name?: string; config?: IntegrationConfig }) =>
    apiCall<IntegrationWithConfig>(`/api/integrations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete integration
  delete: (id: string) =>
    apiCall<{ success: boolean }>(`/api/integrations/${id}`, {
      method: "DELETE",
    }),

  // Test connection
  testConnection: (integrationId: string) =>
    apiCall<{ status: "success" | "error"; message: string }>(
      `/api/integrations/${integrationId}/test`,
      {
        method: "POST",
      }
    ),
};

// Team API
export const teamApi = {
  list: () => apiCall<Team[]>("/api/teams"),
  create: (data: TeamInput) =>
    apiCall<Team>("/api/teams", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (teamId: string, data: TeamUpdateInput) =>
    apiCall<Team>(`/api/teams/${teamId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (teamId: string) =>
    apiCall<{ success: boolean }>(`/api/teams/${teamId}`, {
      method: "DELETE",
    }),
  members: (teamId: string) =>
    apiCall<TeamMemberOrInvite[]>(`/api/teams/${teamId}/members`),
  addMember: (teamId: string, email: string) =>
    apiCall<AddTeamMemberResponse>(`/api/teams/${teamId}/members`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  removeMember: (teamId: string, userId: string) =>
    apiCall<{ success: boolean }>(`/api/teams/${teamId}/members/${userId}`, {
      method: "DELETE",
    }),
  setActiveTeam: (teamId: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TEAM_STORAGE_KEY, teamId);
      window.dispatchEvent(
        new CustomEvent("active-team-change", { detail: { teamId } })
      );
    }
  },
  ensureActiveTeam: async (): Promise<string | null> => {
    if (typeof window === "undefined") {
      return null;
    }

    const stored = getStoredTeamId();
    if (stored) {
      return stored;
    }

    const teams = await apiCall<Team[]>("/api/teams");
    const firstTeam = teams[0];
    if (firstTeam?.id) {
      teamApi.setActiveTeam(firstTeam.id);
      return firstTeam.id;
    }
    return null;
  },
};

// Invite API
export const inviteApi = {
  get: (inviteId: string) => apiCall<InviteDetails>(`/api/invites/${inviteId}`),
  accept: (inviteId: string) =>
    apiCall<AcceptInviteResponse>(`/api/invites/${inviteId}`, {
      method: "POST",
    }),
};

// User API
export const userApi = {
  get: () =>
    apiCall<{
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      isAnonymous: boolean | null;
      providerId: string | null;
    }>("/api/user"),

  update: (data: { name?: string; email?: string }) =>
    apiCall<{ success: boolean }>("/api/user", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Workflow API
export const workflowApi = {
  // Get all workflows
  getAll: () => apiCall<SavedWorkflow[]>("/api/workflows"),

  // Get a specific workflow
  getById: (id: string) => apiCall<SavedWorkflow>(`/api/workflows/${id}`),

  // Create a new workflow
  create: (workflow: Omit<WorkflowData, "id">) =>
    apiCall<SavedWorkflow>("/api/workflows/create", {
      method: "POST",
      body: JSON.stringify(workflow),
    }),

  // Update a workflow
  update: (id: string, workflow: Partial<WorkflowData>) =>
    apiCall<SavedWorkflow>(`/api/workflows/${id}`, {
      method: "PATCH",
      body: JSON.stringify(workflow),
    }),

  // Delete a workflow
  delete: (id: string) =>
    apiCall<{ success: boolean }>(`/api/workflows/${id}`, {
      method: "DELETE",
    }),

  // Get current workflow state
  getCurrent: () => apiCall<WorkflowData>("/api/workflows/current"),

  // Save current workflow state
  saveCurrent: (nodes: WorkflowNode[], edges: WorkflowEdge[]) =>
    apiCall<WorkflowData>("/api/workflows/current", {
      method: "POST",
      body: JSON.stringify({ nodes, edges }),
    }),

  // Execute workflow
  execute: (id: string, input: Record<string, unknown> = {}) =>
    apiCall<{
      executionId: string;
      status: string;
      output?: unknown;
      error?: string;
      duration?: number;
    }>(`/api/workflow/${id}/execute`, {
      method: "POST",
      body: JSON.stringify({ input }),
    }),

  // Trigger workflow via webhook
  triggerWebhook: (id: string, input: Record<string, unknown> = {}) =>
    apiCall<{
      executionId: string;
      status: string;
    }>(`/api/workflows/${id}/webhook`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  // Get workflow code
  getCode: (id: string) =>
    apiCall<{ code: string; workflowName: string }>(
      `/api/workflows/${id}/code`
    ),

  // Get executions
  getExecutions: (id: string) =>
    apiCall<WorkflowRun[]>(`/api/workflows/${id}/executions`),

  // Delete executions
  deleteExecutions: (id: string) =>
    apiCall<{ success: boolean; deletedCount: number }>(
      `/api/workflows/${id}/executions`,
      {
        method: "DELETE",
      }
    ),

  // Get execution logs
  getExecutionLogs: (executionId: string) =>
    apiCall<{
      execution: WorkflowRun & {
        workflow: {
          id: string;
          name: string;
          nodes: unknown;
          edges: unknown;
        };
      };
      logs: WorkflowRunLog[];
    }>(`/api/workflows/executions/${executionId}/logs`),

  // Get execution status
  getExecutionStatus: (executionId: string) =>
    apiCall<{
      status: string;
      nodeStatuses: Array<{
        nodeId: string;
        status: "pending" | "running" | "success" | "error";
      }>;
    }>(`/api/workflows/executions/${executionId}/status`),

  // Cancel execution
  cancelExecution: (executionId: string) =>
    apiCall<{ status: string; cancelledAt?: string }>(
      `/api/workflows/executions/${executionId}/cancel`,
      {
        method: "POST",
      }
    ),

  // Download workflow
  download: (id: string) =>
    apiCall<{
      success: boolean;
      files?: Record<string, string>;
      error?: string;
    }>(`/api/workflows/${id}/download`),

  // Auto-save with debouncing (kept for backwards compatibility)
  autoSaveCurrent: (() => {
    let autosaveTimeout: NodeJS.Timeout | null = null;
    const AUTOSAVE_DELAY = 2000;

    return (nodes: WorkflowNode[], edges: WorkflowEdge[]): void => {
      if (autosaveTimeout) {
        clearTimeout(autosaveTimeout);
      }

      autosaveTimeout = setTimeout(() => {
        workflowApi.saveCurrent(nodes, edges).catch((error) => {
          console.error("Auto-save failed:", error);
        });
      }, AUTOSAVE_DELAY);
    };
  })(),

  // Auto-save specific workflow with debouncing
  autoSaveWorkflow: (() => {
    let autosaveTimeout: NodeJS.Timeout | null = null;
    const AUTOSAVE_DELAY = 2000;

    return (
      id: string,
      data: Partial<WorkflowData>,
      debounce = true
    ): Promise<SavedWorkflow> | undefined => {
      if (!debounce) {
        return workflowApi.update(id, data);
      }

      if (autosaveTimeout) {
        clearTimeout(autosaveTimeout);
      }

      autosaveTimeout = setTimeout(() => {
        workflowApi.update(id, data).catch((error) => {
          console.error("Auto-save failed:", error);
        });
      }, AUTOSAVE_DELAY);
    };
  })(),
};

// Export all APIs as a single object
export const api = {
  ai: aiApi,
  integration: integrationApi,
  invite: inviteApi,
  team: teamApi,
  user: userApi,
  workflow: workflowApi,
};
