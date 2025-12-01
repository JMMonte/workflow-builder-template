import { getAllActions } from "@/plugins";

type ActionConfigHint = {
  description?: string;
  fields?: string[];
  example?: Record<string, unknown>;
};

const ACTION_CONFIG_HINTS: Record<string, ActionConfigHint> = {
  "Send Email": {
    fields: ["actionType", "emailTo", "emailSubject", "emailBody"],
    example: {
      actionType: "Send Email",
      emailTo: "ops@example.com",
      emailSubject: "New signup",
      emailBody: "Please follow up with the new user",
    },
  },
  "Send Slack Message": {
    fields: ["actionType", "slackChannel", "slackMessage"],
    example: {
      actionType: "Send Slack Message",
      slackChannel: "#general",
      slackMessage: "New event received from the webhook",
    },
  },
  "Create Ticket": {
    fields: [
      "actionType",
      "ticketTitle",
      "ticketDescription",
      "ticketPriority",
    ],
    example: {
      actionType: "Create Ticket",
      ticketTitle: "Investigate error",
      ticketDescription: "Error details from previous step",
      ticketPriority: "2",
    },
  },
  "Find Issues": {
    fields: [
      "actionType",
      "linearAssigneeId (optional)",
      "linearTeamId (optional)",
      "linearStatus (optional)",
      "linearLabel (optional)",
    ],
    example: {
      actionType: "Find Issues",
      linearAssigneeId: "usr_123",
      linearStatus: "in_progress",
      linearLabel: "bug",
    },
  },
  "Database Query": {
    fields: ["actionType", "dbQuery", "dbSchema (optional)"],
    example: {
      actionType: "Database Query",
      dbQuery: "SELECT * FROM users LIMIT 10",
    },
  },
  "HTTP Request": {
    fields: ["actionType", "httpMethod", "endpoint", "httpHeaders", "httpBody"],
    example: {
      actionType: "HTTP Request",
      httpMethod: "POST",
      endpoint: "https://api.example.com/events",
      httpHeaders: "{}",
      httpBody: '{"event":"signup","userId":"123"}',
    },
  },
  "Generate Text": {
    fields: [
      "actionType",
      "aiModel",
      "aiFormat (text|object)",
      "aiPrompt",
      "aiSchema (when aiFormat=object)",
    ],
    example: {
      actionType: "Generate Text",
      aiModel: "meta/llama-4-scout",
      aiFormat: "text",
      aiPrompt: "Summarize the scraped markdown",
    },
  },
  "Generate Image": {
    fields: [
      "actionType",
      "imageModel",
      "imagePrompt",
      "imageReference (optional)",
    ],
    example: {
      actionType: "Generate Image",
      imageModel: "google/imagen-4.0-generate",
      imagePrompt: "Hero image of a dashboard for the report",
    },
  },
  "Content Card": {
    fields: [
      "actionType",
      "cardType (text|image)",
      "cardPrompt",
      "imageSourceType (url|base64|upload|node) for image cards",
      "imageUrl or imageBase64 depending on source",
    ],
    example: {
      actionType: "Content Card",
      cardType: "text",
      cardPrompt: "Shared prompt describing the content",
    },
  },
  Scrape: {
    fields: ["actionType", "url"],
    example: {
      actionType: "Scrape",
      url: "https://example.com",
    },
  },
  Search: {
    fields: ["actionType", "query", "limit"],
    example: {
      actionType: "Search",
      query: "latest product launches",
      limit: 5,
    },
  },
  Condition: {
    fields: ["actionType", "condition"],
    example: {
      actionType: "Condition",
      condition: "{{@Response:HTTP Request.status}} === 200",
    },
  },
};

const TRIGGER_CONTEXT = [
  {
    label: "Manual",
    example: { triggerType: "Manual" },
    description: "Run only when manually executed.",
  },
  {
    label: "Schedule",
    example: {
      triggerType: "Schedule",
      scheduleCron: "0 9 * * *",
      scheduleTimezone: "America/New_York",
    },
    description: "Run on a cron schedule (cron + timezone required).",
  },
  {
    label: "Webhook",
    example: {
      triggerType: "Webhook",
      webhookSchema: "[]",
      webhookMockRequest: "{}",
    },
    description:
      "Run on inbound HTTP request. Use webhookSchema/mockRequest when needed.",
  },
];

function formatActionContext(): string {
  const actions = getAllActions();

  if (!actions.length) {
    return "No actions registered.";
  }

  return actions
    .map((action) => {
      const hint = ACTION_CONFIG_HINTS[action.id];
      const base = `${action.id}: ${action.description}`;

      if (!hint) {
        return `${base}. Config: {"actionType": "${action.id}", ...}`;
      }

      const fields = hint.fields ? `Fields: ${hint.fields.join(", ")}` : "";
      const example = hint.example
        ? `Example config: ${JSON.stringify(hint.example)}`
        : "";

      return [base, fields, example].filter(Boolean).join(" | ");
    })
    .join("\n");
}

function formatTriggerContext(): string {
  return TRIGGER_CONTEXT.map(
    (trigger) =>
      `${trigger.label}: ${trigger.description} Example config: ${JSON.stringify(trigger.example)}`
  ).join("\n");
}

/**
 * Build the system prompt for workflow generation using current cards
 */
export function buildWorkflowSystemPrompt(): string {
  const triggerContext = formatTriggerContext();
  const actionContext = formatActionContext();

  return `You are a workflow automation expert. Generate a workflow based on the user's description.

CRITICAL: Output your workflow as INDIVIDUAL OPERATIONS, one per line in JSONL format.
Each line must be a complete, separate JSON object.

Operations you can output:
1. {"op": "setName", "name": "Workflow Name"}
2. {"op": "setDescription", "description": "Brief description"}
3. {"op": "addNode", "node": {COMPLETE_NODE_OBJECT}}
4. {"op": "addEdge", "edge": {COMPLETE_EDGE_OBJECT}}
5. {"op": "removeNode", "nodeId": "node-id-to-remove"}
6. {"op": "removeEdge", "edgeId": "edge-id-to-remove"}
7. {"op": "updateNode", "nodeId": "node-id", "updates": {"position": {"x": 100, "y": 200}}}

IMPORTANT RULES:
- Every workflow must have EXACTLY ONE trigger node
- Output ONE operation per line
- Each line must be complete, valid JSON
- Start with setName and setDescription
- Then add nodes one at a time
- Finally add edges one at a time to CONNECT ALL NODES
- CRITICAL: Every node (except the last) MUST be connected to at least one other node
- To update node positions or properties, use updateNode operation
- NEVER output explanatory text - ONLY JSON operations
- Do NOT wrap in markdown code blocks
- Do NOT add explanatory text

Node structure:
{
  "id": "unique-id",
  "type": "trigger" or "action",
  "position": {"x": number, "y": number},
  "data": {
    "label": "Node Label",
    "description": "Node description",
    "type": "trigger" or "action",
    "config": {...},
    "status": "idle"
  }
}

Triggers (set data.config.triggerType):
${triggerContext}

Actions (set data.config.actionType):
${actionContext}

CRITICAL ABOUT CONDITION NODES:
- Condition nodes evaluate a boolean expression
- When TRUE: ALL connected nodes execute
- When FALSE: ALL connected nodes are SKIPPED
- For if/else logic, CREATE MULTIPLE SEPARATE condition nodes (one per branch)
- NEVER connect multiple different outcome paths to a single condition node
- Each condition should check for ONE specific case

Edge structure:
{
  "id": "edge-id",
  "source": "source-node-id",
  "target": "target-node-id",
  "type": "default"
}

WORKFLOW FLOW:
- Trigger connects to first action
- Actions connect in sequence or to multiple branches
- ALWAYS create edges to connect the workflow flow
- For linear workflows: trigger -> action1 -> action2 -> etc
- For branching (conditions): one source can connect to multiple targets

Example output:
{"op": "setName", "name": "Contact Form Workflow"}
{"op": "setDescription", "description": "Processes contact form submissions"}
{"op": "addNode", "node": {"id": "trigger-1", "type": "trigger", "position": {"x": 100, "y": 200}, "data": {"label": "Contact Form", "type": "trigger", "config": {"triggerType": "Manual"}, "status": "idle"}}}
{"op": "addNode", "node": {"id": "send-email", "type": "action", "position": {"x": 400, "y": 200}, "data": {"label": "Send Email", "type": "action", "config": {"actionType": "Send Email", "emailTo": "admin@example.com", "emailSubject": "New Contact", "emailBody": "New contact form submission"}, "status": "idle"}}}
{"op": "addEdge", "edge": {"id": "e1", "source": "trigger-1", "target": "send-email", "type": "default"}}

REMEMBER: After adding all nodes, you MUST add edges to connect them! Every node should be reachable from the trigger.`;
}
