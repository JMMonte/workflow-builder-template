"use client";

import { useAtom, useAtomValue } from "jotai";
import { Copy, Settings } from "lucide-react";
import NextImage from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { Input } from "@/components/ui/input";
import { IntegrationIcon } from "@/components/ui/integration-icon";
import { Label } from "@/components/ui/label";
import { LabelWithVariablePicker } from "@/components/ui/label-with-variable-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateBadgeInput } from "@/components/ui/template-badge-input";
import { TemplateBadgeTextarea } from "@/components/ui/template-badge-textarea";
import {
  currentWorkflowIdAtom,
  currentWorkflowNameAtom,
  edgesAtom,
  nodesAtom,
  selectedNodeAtom,
  type WorkflowEdge,
  type WorkflowNode,
} from "@/lib/workflow-store";
import { AiGatewayModelSelect } from "./ai-gateway-model-select";
import { SchemaBuilder, type SchemaField } from "./schema-builder";

const TEMPLATE_PATTERN = /\{\{.*\}\}/;

function getContentCardPreviewSrc(config: Record<string, unknown>) {
  const base64 = (config?.imageBase64 as string) || "";
  const url = (config?.imageUrl as string) || "";

  if (base64 && !TEMPLATE_PATTERN.test(base64)) {
    if (base64.startsWith("data:")) {
      return base64;
    }
    return `data:image/png;base64,${base64}`;
  }

  if (url && !TEMPLATE_PATTERN.test(url)) {
    return url;
  }

  return null;
}

function getUpstreamNodes(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  currentNodeId?: string | null
): WorkflowNode[] {
  if (!currentNodeId) {
    return [];
  }

  const upstreamIds = new Set<string>();

  const traverse = (nodeId: string) => {
    const incomingEdges = edges.filter((edge) => edge.target === nodeId);
    for (const edge of incomingEdges) {
      if (!upstreamIds.has(edge.source)) {
        upstreamIds.add(edge.source);
        traverse(edge.source);
      }
    }
  };

  traverse(currentNodeId);

  return nodes.filter((node) => upstreamIds.has(node.id));
}

type ActionConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  onUpdateConfigBatch?: (updates: Record<string, unknown>) => void;
  disabled: boolean;
};

// Send Email fields component
function SendEmailFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="emailTo"
          onVariableSelect={(template) => {
            const currentValue = (config?.emailTo as string) || "";
            onUpdateConfig("emailTo", currentValue + template);
          }}
        >
          To (Email Address)
        </LabelWithVariablePicker>
        <TemplateBadgeInput
          disabled={disabled}
          id="emailTo"
          onChange={(value) => onUpdateConfig("emailTo", value)}
          placeholder="user@example.com or {{NodeName.email}}"
          value={(config?.emailTo as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="emailSubject"
          onVariableSelect={(template) => {
            const currentValue = (config?.emailSubject as string) || "";
            onUpdateConfig("emailSubject", currentValue + template);
          }}
        >
          Subject
        </LabelWithVariablePicker>
        <TemplateBadgeInput
          disabled={disabled}
          id="emailSubject"
          onChange={(value) => onUpdateConfig("emailSubject", value)}
          placeholder="Subject or {{NodeName.title}}"
          value={(config?.emailSubject as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="emailBody"
          onVariableSelect={(template) => {
            const currentValue = (config?.emailBody as string) || "";
            onUpdateConfig("emailBody", currentValue + template);
          }}
        >
          Body
        </LabelWithVariablePicker>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="emailBody"
          onChange={(value) => onUpdateConfig("emailBody", value)}
          placeholder="Email body. Use {{NodeName.field}} to insert data from previous nodes."
          rows={4}
          value={(config?.emailBody as string) || ""}
        />
      </div>
    </>
  );
}

// Send Slack Message fields component
function SendSlackMessageFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="slackChannel"
          onVariableSelect={(template) => {
            const currentValue = (config?.slackChannel as string) || "";
            onUpdateConfig("slackChannel", currentValue + template);
          }}
        >
          Channel
        </LabelWithVariablePicker>
        <TemplateBadgeInput
          disabled={disabled}
          id="slackChannel"
          onChange={(value) => onUpdateConfig("slackChannel", value)}
          placeholder="#general or @username or {{NodeName.channel}}"
          value={(config?.slackChannel as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="slackMessage"
          onVariableSelect={(template) => {
            const currentValue = (config?.slackMessage as string) || "";
            onUpdateConfig("slackMessage", currentValue + template);
          }}
        >
          Message
        </LabelWithVariablePicker>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="slackMessage"
          onChange={(value) => onUpdateConfig("slackMessage", value)}
          placeholder="Your message. Use {{NodeName.field}} to insert data from previous nodes."
          rows={4}
          value={(config?.slackMessage as string) || ""}
        />
      </div>
    </>
  );
}

function SendGmailFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="gmail-to"
          onVariableSelect={(template) => {
            const currentValue = (config?.to as string) || "";
            onUpdateConfig("to", currentValue + template);
          }}
        >
          To (Email Address)
        </LabelWithVariablePicker>
        <TemplateBadgeInput
          disabled={disabled}
          id="gmail-to"
          onChange={(value) => onUpdateConfig("to", value)}
          placeholder="user@example.com or {{NodeName.email}}"
          value={(config?.to as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="gmail-subject"
          onVariableSelect={(template) => {
            const currentValue = (config?.subject as string) || "";
            onUpdateConfig("subject", currentValue + template);
          }}
        >
          Subject
        </LabelWithVariablePicker>
        <TemplateBadgeInput
          disabled={disabled}
          id="gmail-subject"
          onChange={(value) => onUpdateConfig("subject", value)}
          placeholder="Subject or {{NodeName.title}}"
          value={(config?.subject as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="gmail-body"
          onVariableSelect={(template) => {
            const currentValue = (config?.body as string) || "";
            onUpdateConfig("body", currentValue + template);
          }}
        >
          Body
        </LabelWithVariablePicker>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="gmail-body"
          onChange={(value) => onUpdateConfig("body", value)}
          placeholder="Email body. Use {{NodeName.field}} to insert data from previous nodes."
          rows={4}
          value={(config?.body as string) || ""}
        />
      </div>
    </div>
  );
}

function GoogleCalendarFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="google-event-title"
          onVariableSelect={(template) => {
            const currentValue = (config?.title as string) || "";
            onUpdateConfig("title", currentValue + template);
          }}
        >
          Title
        </LabelWithVariablePicker>
        <TemplateBadgeInput
          disabled={disabled}
          id="google-event-title"
          onChange={(value) => onUpdateConfig("title", value)}
          placeholder="Weekly Sync"
          value={(config?.title as string) || ""}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="google-event-start">Start (ISO)</Label>
          <TemplateBadgeInput
            disabled={disabled}
            id="google-event-start"
            onChange={(value) => onUpdateConfig("start", value)}
            placeholder="2025-01-01T10:00:00Z"
            value={(config?.start as string) || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="google-event-end">End (ISO)</Label>
          <TemplateBadgeInput
            disabled={disabled}
            id="google-event-end"
            onChange={(value) => onUpdateConfig("end", value)}
            placeholder="2025-01-01T11:00:00Z"
            value={(config?.end as string) || ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="google-event-description">Description</Label>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="google-event-description"
          onChange={(value) => onUpdateConfig("description", value)}
          placeholder="Agenda and details"
          rows={3}
          value={(config?.description as string) || ""}
        />
      </div>
    </div>
  );
}

function GoogleDriveUploadFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="drive-file-url">File URL</Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="drive-file-url"
          onChange={(value) => onUpdateConfig("fileUrl", value)}
          placeholder="https://example.com/file.pdf"
          value={(config?.fileUrl as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="drive-folder-id">
          Destination Folder ID (optional)
        </Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="drive-folder-id"
          onChange={(value) => onUpdateConfig("folderId", value)}
          placeholder="drive-folder-id"
          value={(config?.folderId as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="drive-mime-type">MIME Type</Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="drive-mime-type"
          onChange={(value) => onUpdateConfig("mimeType", value)}
          placeholder="application/pdf"
          value={(config?.mimeType as string) || ""}
        />
      </div>
    </div>
  );
}

function SendOutlookFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="outlook-to"
          onVariableSelect={(template) => {
            const currentValue = (config?.to as string) || "";
            onUpdateConfig("to", currentValue + template);
          }}
        >
          To (Email Address)
        </LabelWithVariablePicker>
        <TemplateBadgeInput
          disabled={disabled}
          id="outlook-to"
          onChange={(value) => onUpdateConfig("to", value)}
          placeholder="user@example.com or {{NodeName.email}}"
          value={(config?.to as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="outlook-subject"
          onVariableSelect={(template) => {
            const currentValue = (config?.subject as string) || "";
            onUpdateConfig("subject", currentValue + template);
          }}
        >
          Subject
        </LabelWithVariablePicker>
        <TemplateBadgeInput
          disabled={disabled}
          id="outlook-subject"
          onChange={(value) => onUpdateConfig("subject", value)}
          placeholder="Subject or {{NodeName.title}}"
          value={(config?.subject as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="outlook-body"
          onVariableSelect={(template) => {
            const currentValue = (config?.body as string) || "";
            onUpdateConfig("body", currentValue + template);
          }}
        >
          Body
        </LabelWithVariablePicker>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="outlook-body"
          onChange={(value) => onUpdateConfig("body", value)}
          placeholder="Email body. Use {{NodeName.field}} to insert data from previous nodes."
          rows={4}
          value={(config?.body as string) || ""}
        />
      </div>
    </div>
  );
}

function TeamsMessageFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="teams-team-id">Team ID</Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="teams-team-id"
          onChange={(value) => onUpdateConfig("teamId", value)}
          placeholder="team-id"
          value={(config?.teamId as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="teams-channel-id">Channel ID</Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="teams-channel-id"
          onChange={(value) => onUpdateConfig("channelId", value)}
          placeholder="channel-id"
          value={(config?.channelId as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="teams-message">Message</Label>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="teams-message"
          onChange={(value) => onUpdateConfig("content", value)}
          placeholder="Message content"
          rows={3}
          value={(config?.content as string) || ""}
        />
      </div>
    </div>
  );
}

function OneDriveUploadFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="onedrive-file-url">File URL</Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="onedrive-file-url"
          onChange={(value) => onUpdateConfig("fileUrl", value)}
          placeholder="https://example.com/file.pdf"
          value={(config?.fileUrl as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="onedrive-folder-path">Folder Path (optional)</Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="onedrive-folder-path"
          onChange={(value) => onUpdateConfig("folderPath", value)}
          placeholder="/Documents"
          value={(config?.folderPath as string) || ""}
        />
      </div>
    </div>
  );
}

function SharePointPageFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="sharepoint-site-id">Site ID</Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="sharepoint-site-id"
          onChange={(value) => onUpdateConfig("siteId", value)}
          placeholder="site-id"
          value={(config?.siteId as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sharepoint-title">Title</Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="sharepoint-title"
          onChange={(value) => onUpdateConfig("title", value)}
          placeholder="Page title"
          value={(config?.title as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sharepoint-content">Content</Label>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="sharepoint-content"
          onChange={(value) => onUpdateConfig("content", value)}
          placeholder="Page content (HTML or text)"
          rows={4}
          value={(config?.content as string) || ""}
        />
      </div>
    </div>
  );
}

function MicrosoftEventFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="ms-event-title">Title</Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="ms-event-title"
          onChange={(value) => onUpdateConfig("title", value)}
          placeholder="Meeting title"
          value={(config?.title as string) || ""}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ms-event-start">Start (ISO)</Label>
          <TemplateBadgeInput
            disabled={disabled}
            id="ms-event-start"
            onChange={(value) => onUpdateConfig("start", value)}
            placeholder="2025-01-01T10:00:00Z"
            value={(config?.start as string) || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ms-event-end">End (ISO)</Label>
          <TemplateBadgeInput
            disabled={disabled}
            id="ms-event-end"
            onChange={(value) => onUpdateConfig("end", value)}
            placeholder="2025-01-01T11:00:00Z"
            value={(config?.end as string) || ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ms-event-description">Description</Label>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="ms-event-description"
          onChange={(value) => onUpdateConfig("description", value)}
          placeholder="Agenda and details"
          rows={3}
          value={(config?.description as string) || ""}
        />
      </div>
    </div>
  );
}

// Create Ticket fields component
function CreateTicketFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="ticketTitle"
          onVariableSelect={(template) => {
            const currentValue = (config?.ticketTitle as string) || "";
            onUpdateConfig("ticketTitle", currentValue + template);
          }}
        >
          Ticket Title
        </LabelWithVariablePicker>
        <TemplateBadgeInput
          disabled={disabled}
          id="ticketTitle"
          onChange={(value) => onUpdateConfig("ticketTitle", value)}
          placeholder="Bug report or {{NodeName.title}}"
          value={(config?.ticketTitle as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="ticketDescription"
          onVariableSelect={(template) => {
            const currentValue = (config?.ticketDescription as string) || "";
            onUpdateConfig("ticketDescription", currentValue + template);
          }}
        >
          Description
        </LabelWithVariablePicker>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="ticketDescription"
          onChange={(value) => onUpdateConfig("ticketDescription", value)}
          placeholder="Description. Use {{NodeName.field}} to insert data from previous nodes."
          rows={4}
          value={(config?.ticketDescription as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label className="ml-1" htmlFor="ticketPriority">
          Priority
        </Label>
        <Select
          disabled={disabled}
          onValueChange={(value) => onUpdateConfig("ticketPriority", value)}
          value={(config?.ticketPriority as string) || "2"}
        >
          <SelectTrigger className="w-full" id="ticketPriority">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">No Priority</SelectItem>
            <SelectItem value="1">Urgent</SelectItem>
            <SelectItem value="2">High</SelectItem>
            <SelectItem value="3">Medium</SelectItem>
            <SelectItem value="4">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

// Find Issues fields component
function FindIssuesFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="linearAssigneeId"
          onVariableSelect={(template) => {
            const currentValue = (config?.linearAssigneeId as string) || "";
            onUpdateConfig("linearAssigneeId", currentValue + template);
          }}
        >
          Assignee (User ID)
        </LabelWithVariablePicker>
        <TemplateBadgeInput
          disabled={disabled}
          id="linearAssigneeId"
          onChange={(value) => onUpdateConfig("linearAssigneeId", value)}
          placeholder="user-id-123 or {{NodeName.userId}}"
          value={(config?.linearAssigneeId as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="linearTeamId"
          onVariableSelect={(template) => {
            const currentValue = (config?.linearTeamId as string) || "";
            onUpdateConfig("linearTeamId", currentValue + template);
          }}
        >
          Team ID (optional)
        </LabelWithVariablePicker>
        <TemplateBadgeInput
          disabled={disabled}
          id="linearTeamId"
          onChange={(value) => onUpdateConfig("linearTeamId", value)}
          placeholder="team-id-456 or {{NodeName.teamId}}"
          value={(config?.linearTeamId as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label className="ml-1" htmlFor="linearStatus">
          Status (optional)
        </Label>
        <Select
          disabled={disabled}
          onValueChange={(value) => onUpdateConfig("linearStatus", value)}
          value={(config?.linearStatus as string) || "any"}
        >
          <SelectTrigger className="w-full" id="linearStatus">
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="backlog">Backlog</SelectItem>
            <SelectItem value="todo">Todo</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="linearLabel"
          onVariableSelect={(template) => {
            const currentValue = (config?.linearLabel as string) || "";
            onUpdateConfig("linearLabel", currentValue + template);
          }}
        >
          Label (optional)
        </LabelWithVariablePicker>
        <TemplateBadgeInput
          disabled={disabled}
          id="linearLabel"
          onChange={(value) => onUpdateConfig("linearLabel", value)}
          placeholder="bug, feature, etc. or {{NodeName.label}}"
          value={(config?.linearLabel as string) || ""}
        />
      </div>
    </>
  );
}

// Database Query fields component
function DatabaseQueryFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="dbQuery">SQL Query</Label>
        <div className="overflow-hidden rounded-md border">
          <CodeEditor
            defaultLanguage="sql"
            height="150px"
            onChange={(value) => onUpdateConfig("dbQuery", value || "")}
            options={{
              minimap: { enabled: false },
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              fontSize: 12,
              readOnly: disabled,
              wordWrap: "off",
            }}
            value={(config?.dbQuery as string) || ""}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          The DATABASE_URL from your project integrations will be used to
          execute this query.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Schema (Optional)</Label>
        <SchemaBuilder
          disabled={disabled}
          onChange={(schema) =>
            onUpdateConfig("dbSchema", JSON.stringify(schema))
          }
          schema={
            config?.dbSchema
              ? (JSON.parse(config.dbSchema as string) as SchemaField[])
              : []
          }
        />
      </div>
    </>
  );
}

// HTTP Request fields component
function HttpRequestFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="httpMethod">HTTP Method</Label>
        <Select
          disabled={disabled}
          onValueChange={(value) => onUpdateConfig("httpMethod", value)}
          value={(config?.httpMethod as string) || "POST"}
        >
          <SelectTrigger className="w-full" id="httpMethod">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <LabelWithVariablePicker
          htmlFor="endpoint"
          onVariableSelect={(template) => {
            const currentValue = (config?.endpoint as string) || "";
            onUpdateConfig("endpoint", currentValue + template);
          }}
        >
          URL
        </LabelWithVariablePicker>
        <TemplateBadgeInput
          disabled={disabled}
          id="endpoint"
          onChange={(value) => onUpdateConfig("endpoint", value)}
          placeholder="https://api.example.com/endpoint or {{NodeName.url}}"
          value={(config?.endpoint as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="httpHeaders">Headers (JSON)</Label>
        <div className="overflow-hidden rounded-md border">
          <CodeEditor
            defaultLanguage="json"
            height="100px"
            onChange={(value) => onUpdateConfig("httpHeaders", value || "{}")}
            options={{
              minimap: { enabled: false },
              lineNumbers: "off",
              scrollBeyondLastLine: false,
              fontSize: 12,
              readOnly: disabled,
              wordWrap: "off",
            }}
            value={(config?.httpHeaders as string) || "{}"}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="httpBody">Body (JSON)</Label>
        <div
          className={`overflow-hidden rounded-md border ${config?.httpMethod === "GET" ? "opacity-50" : ""}`}
        >
          <CodeEditor
            defaultLanguage="json"
            height="120px"
            onChange={(value) => onUpdateConfig("httpBody", value || "{}")}
            options={{
              minimap: { enabled: false },
              lineNumbers: "off",
              scrollBeyondLastLine: false,
              fontSize: 12,
              readOnly: config?.httpMethod === "GET" || disabled,
              domReadOnly: config?.httpMethod === "GET" || disabled,
              wordWrap: "off",
            }}
            value={(config?.httpBody as string) || "{}"}
          />
        </div>
        {config?.httpMethod === "GET" && (
          <p className="text-muted-foreground text-xs">
            Body is disabled for GET requests
          </p>
        )}
      </div>
    </>
  );
}

// Generate Text fields component
function GenerateTextFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="aiFormat">Format</Label>
        <Select
          disabled={disabled}
          onValueChange={(value) => onUpdateConfig("aiFormat", value)}
          value={(config?.aiFormat as string) || "text"}
        >
          <SelectTrigger className="w-full" id="aiFormat">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="object">Object</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="aiModel">Model</Label>
        <AiGatewayModelSelect
          disabled={disabled}
          integrationId={(config?.integrationId as string) || undefined}
          modelType="language"
          onChange={(value) => onUpdateConfig("aiModel", value)}
          placeholder="Select model"
          selectId="aiModel"
          value={(config?.aiModel as string) || "meta/llama-4-scout"}
        />
      </div>
      <div className="space-y-2">
        <LabelWithVariablePicker
          htmlFor="aiPrompt"
          onVariableSelect={(template) => {
            const currentValue = (config?.aiPrompt as string) || "";
            onUpdateConfig("aiPrompt", currentValue + template);
          }}
        >
          Prompt
        </LabelWithVariablePicker>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="aiPrompt"
          onChange={(value) => onUpdateConfig("aiPrompt", value)}
          placeholder="Enter your prompt here. Use {{NodeName.field}} to reference previous outputs."
          rows={4}
          value={(config?.aiPrompt as string) || ""}
        />
      </div>
      {config?.aiFormat === "object" && (
        <div className="space-y-2">
          <Label>Schema</Label>
          <SchemaBuilder
            disabled={disabled}
            onChange={(schema) =>
              onUpdateConfig("aiSchema", JSON.stringify(schema))
            }
            schema={
              config?.aiSchema
                ? (JSON.parse(config.aiSchema as string) as SchemaField[])
                : []
            }
          />
        </div>
      )}
    </>
  );
}

// Generate Image fields component
function GenerateImageFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="imageModel">Model</Label>
        <AiGatewayModelSelect
          disabled={disabled}
          integrationId={(config?.integrationId as string) || undefined}
          modelType="image"
          onChange={(value) => onUpdateConfig("imageModel", value)}
          placeholder="Select model"
          selectId="imageModel"
          value={(config?.imageModel as string) || "google/imagen-4.0-generate"}
        />
      </div>
      <div className="space-y-2">
        <LabelWithVariablePicker
          htmlFor="imagePrompt"
          onVariableSelect={(template) => {
            const currentValue = (config?.imagePrompt as string) || "";
            onUpdateConfig("imagePrompt", currentValue + template);
          }}
        >
          Prompt
        </LabelWithVariablePicker>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="imagePrompt"
          onChange={(value) => onUpdateConfig("imagePrompt", value)}
          placeholder="Describe the image you want to generate. Use {{NodeName.field}} to reference previous outputs."
          rows={4}
          value={(config?.imagePrompt as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <LabelWithVariablePicker
          htmlFor="imageReference"
          onVariableSelect={(template) => {
            const currentValue = (config?.imageReference as string) || "";
            onUpdateConfig("imageReference", currentValue + template);
          }}
        >
          Reference Image (optional)
        </LabelWithVariablePicker>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="imageReference"
          onChange={(value) => onUpdateConfig("imageReference", value)}
          placeholder="Paste a URL, base64 string, or template reference to reuse an existing image."
          rows={3}
          value={(config?.imageReference as string) || ""}
        />
      </div>
    </>
  );
}

// Content Card fields component
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Handles multiple content card sources and preview states in one UI section
function ContentCardFields({
  config,
  onUpdateConfig,
  onUpdateConfigBatch,
  disabled,
  upstreamNodes,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  onUpdateConfigBatch?: (updates: Record<string, unknown>) => void;
  disabled: boolean;
  upstreamNodes: WorkflowNode[];
}) {
  const cardType = (config?.cardType as string) || "text";
  const imageSourceType = (config?.imageSourceType as string) || "url";
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  const upstreamImageNodes = upstreamNodes.filter((node) => {
    const triggerType = node.data.config?.triggerType as string | undefined;
    return (
      node.data.type === "action" ||
      (node.data.type === "trigger" &&
        (triggerType === "Webhook" || triggerType === "Websocket"))
    );
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadedFileName(file.name);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        // Store the complete data URL (includes mime type)
        if (onUpdateConfigBatch) {
          onUpdateConfigBatch({
            imageBase64: result,
            cardType: "image",
            imageUrl: "",
            imageSourceType: "upload",
            uploadedFileName: file.name,
          });
        } else {
          onUpdateConfig("imageBase64", result);
          onUpdateConfig("cardType", "image");
          onUpdateConfig("imageUrl", "");
          onUpdateConfig("imageSourceType", "upload");
          onUpdateConfig("uploadedFileName", file.name);
        }
      }
      setIsUploading(false);
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      setIsUploading(false);
      setUploadedFileName("");
    };

    reader.readAsDataURL(file);
  };

  const handleUpstreamImageSelect = (nodeId: string) => {
    if (nodeId === "none") {
      if (onUpdateConfigBatch) {
        onUpdateConfigBatch({
          imageBase64: "",
          imageUrl: "",
          cardType: "image",
          imageSourceType: "node",
        });
      } else {
        onUpdateConfig("imageBase64", "");
        onUpdateConfig("imageUrl", "");
        onUpdateConfig("cardType", "image");
        onUpdateConfig("imageSourceType", "node");
      }
      return;
    }

    const node = upstreamImageNodes.find((n) => n.id === nodeId);
    const nodeLabel = node?.data.label || "Node";
    const field =
      node?.data.config?.actionType === "Content Card" ? "image" : "base64";

    if (onUpdateConfigBatch) {
      onUpdateConfigBatch({
        imageBase64: `{{@${nodeId}:${nodeLabel}.${field}}}`,
        imageUrl: "",
        cardType: "image",
        imageSourceType: "node",
      });
    } else {
      onUpdateConfig("imageBase64", `{{@${nodeId}:${nodeLabel}.${field}}}`);
      onUpdateConfig("imageUrl", "");
      onUpdateConfig("cardType", "image");
      onUpdateConfig("imageSourceType", "node");
    }
  };

  const handleCardTypeChange = (value: string) => {
    if (value === "text") {
      setUploadedFileName("");
      if (onUpdateConfigBatch) {
        onUpdateConfigBatch({
          cardType: "text",
          imageBase64: "",
          imageUrl: "",
          imageSourceType: "url",
          uploadedFileName: "",
        });
      } else {
        onUpdateConfig("cardType", "text");
        onUpdateConfig("imageBase64", "");
        onUpdateConfig("imageUrl", "");
        onUpdateConfig("imageSourceType", "url");
        onUpdateConfig("uploadedFileName", "");
      }
      return;
    }

    const nextSourceType = (config?.imageSourceType as string) || "url";

    if (onUpdateConfigBatch) {
      onUpdateConfigBatch({
        cardType: value,
        imageSourceType: nextSourceType,
      });
    } else {
      onUpdateConfig("cardType", value);
      onUpdateConfig("imageSourceType", nextSourceType);
    }
  };

  const previewSrc = getContentCardPreviewSrc(config);

  // Get filename from config or state
  const displayFileName =
    (config?.uploadedFileName as string) || uploadedFileName;

  return (
    <>
      <div className="space-y-2">
        <Label className="ml-1" htmlFor="cardType">
          Card Type
        </Label>
        <Select
          disabled={disabled}
          onValueChange={handleCardTypeChange}
          value={cardType}
        >
          <SelectTrigger className="w-full" id="cardType">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="image">Image</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <LabelWithVariablePicker
          className="ml-1"
          htmlFor="cardPrompt"
          onVariableSelect={(template) => {
            const currentValue = (config?.cardPrompt as string) || "";
            onUpdateConfig("cardPrompt", currentValue + template);
          }}
        >
          Prompt
        </LabelWithVariablePicker>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="cardPrompt"
          onChange={(value) => onUpdateConfig("cardPrompt", value)}
          placeholder="Describe the text or image you want to reuse across steps."
          rows={4}
          value={(config?.cardPrompt as string) || ""}
        />
      </div>
      {(cardType === "image" || previewSrc) && (
        <>
          <div className="space-y-2">
            <Label className="ml-1" htmlFor="imageSourceType">
              Image Source
            </Label>
            <Select
              disabled={disabled}
              onValueChange={(value) =>
                onUpdateConfig("imageSourceType", value)
              }
              value={imageSourceType}
            >
              <SelectTrigger className="w-full" id="imageSourceType">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="base64">Base64 / Template</SelectItem>
                <SelectItem value="upload">Upload</SelectItem>
                <SelectItem value="node">From previous step</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {imageSourceType === "url" && (
            <div className="space-y-2">
              <LabelWithVariablePicker
                className="ml-1"
                htmlFor="imageUrl"
                onVariableSelect={(template) => {
                  const currentValue = (config?.imageUrl as string) || "";
                  onUpdateConfig("imageUrl", currentValue + template);
                }}
              >
                Image URL
              </LabelWithVariablePicker>
              <TemplateBadgeInput
                disabled={disabled}
                id="imageUrl"
                onChange={(value) => onUpdateConfig("imageUrl", value)}
                placeholder="https://example.com/image.png or {{Node.imageUrl}}"
                value={(config?.imageUrl as string) || ""}
              />
            </div>
          )}
          {imageSourceType === "base64" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <LabelWithVariablePicker
                  className="ml-1"
                  htmlFor="imageBase64"
                  onVariableSelect={(template) => {
                    const currentValue = (config?.imageBase64 as string) || "";
                    onUpdateConfig("imageBase64", currentValue + template);
                  }}
                >
                  Image Data (base64)
                </LabelWithVariablePicker>
                <Button
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    const value = (config?.imageBase64 as string) || "";
                    if (!value) {
                      return;
                    }
                    navigator.clipboard.writeText(value);
                    toast.success("Base64 copied to clipboard");
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <Copy className="mr-1 size-3" />
                  Copy
                </Button>
              </div>
              <TemplateBadgeTextarea
                className="max-h-[200px] min-h-[80px]"
                disabled={disabled}
                id="imageBase64"
                onChange={(value) => onUpdateConfig("imageBase64", value)}
                placeholder="Paste a base64 string or template reference."
                rows={3}
                value={(config?.imageBase64 as string) || ""}
              />
            </div>
          )}
          {imageSourceType === "upload" && (
            <div className="space-y-2">
              <Label className="ml-1" htmlFor="imageUpload">
                Upload image
              </Label>
              <Input
                accept="image/*"
                disabled={disabled || isUploading}
                id="imageUpload"
                onChange={handleFileUpload}
                type="file"
              />
              {isUploading && (
                <p className="text-muted-foreground text-xs">
                  Uploading {displayFileName}...
                </p>
              )}
              {!isUploading && displayFileName && (
                <p className="text-muted-foreground text-xs">
                  Uploaded: {displayFileName}
                </p>
              )}
            </div>
          )}
          {imageSourceType === "node" && (
            <div className="space-y-2">
              <Label className="ml-1" htmlFor="imageNodeSource">
                Select previous step
              </Label>
              <Select
                disabled={disabled}
                onValueChange={handleUpstreamImageSelect}
                value="none"
              >
                <SelectTrigger className="w-full" id="imageNodeSource">
                  <SelectValue placeholder="Choose a previous step" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {upstreamImageNodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.data.label || "Step"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Pulling image/base64 output from the selected step.
              </p>
            </div>
          )}
          {previewSrc && (
            <div className="space-y-2">
              <Label className="ml-1">Preview</Label>
              <div className="relative h-32 w-full overflow-hidden rounded-md border">
                <div className="relative h-full w-full">
                  <NextImage
                    alt="Preview"
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    src={previewSrc}
                    unoptimized
                  />
                </div>
              </div>
              <TemplateBadgeTextarea
                disabled
                id="imagePreviewValue"
                rows={3}
                value={(() => {
                  const val =
                    (config?.imageBase64 as string) ||
                    (config?.imageUrl as string) ||
                    "";
                  return val.length > 100 ? `${val.slice(0, 100)}...` : val;
                })()}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}

// Condition fields component
function ConditionFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <LabelWithVariablePicker
        htmlFor="condition"
        onVariableSelect={(template) => {
          const currentValue = (config?.condition as string) || "";
          onUpdateConfig("condition", currentValue + template);
        }}
      >
        Condition Expression
      </LabelWithVariablePicker>
      <TemplateBadgeInput
        disabled={disabled}
        id="condition"
        onChange={(value) => onUpdateConfig("condition", value)}
        placeholder="e.g., 5 > 3, status === 200, {{PreviousNode.value}} > 100"
        value={(config?.condition as string) || ""}
      />
      <p className="text-muted-foreground text-xs">
        Enter a JavaScript expression that evaluates to true or false. You can
        use @ to reference previous node outputs.
      </p>
    </div>
  );
}

// Scrape fields component
function ScrapeFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <LabelWithVariablePicker
        htmlFor="url"
        onVariableSelect={(template) => {
          const currentValue = (config?.url as string) || "";
          onUpdateConfig("url", currentValue + template);
        }}
      >
        URL
      </LabelWithVariablePicker>
      <TemplateBadgeInput
        disabled={disabled}
        id="url"
        onChange={(value) => onUpdateConfig("url", value)}
        placeholder="https://example.com or {{NodeName.url}}"
        value={(config?.url as string) || ""}
      />
    </div>
  );
}

// Search fields component
function SearchFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <LabelWithVariablePicker
          htmlFor="query"
          onVariableSelect={(template) => {
            const currentValue = (config?.query as string) || "";
            onUpdateConfig("query", currentValue + template);
          }}
        >
          Search Query
        </LabelWithVariablePicker>
        <TemplateBadgeInput
          disabled={disabled}
          id="query"
          onChange={(value) => onUpdateConfig("query", value)}
          placeholder="Search query or {{NodeName.query}}"
          value={(config?.query as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="limit">Result Limit</Label>
        <Input
          disabled={disabled}
          id="limit"
          onChange={(e) => onUpdateConfig("limit", e.target.value)}
          placeholder="10"
          type="number"
          value={(config?.limit as string) || ""}
        />
      </div>
    </>
  );
}

// Action categories and their actions
const ACTION_CATEGORIES = {
  System: ["HTTP Request", "Database Query", "Condition", "Content Card"],
  "AI Gateway": ["Generate Text", "Generate Image"],
  Firecrawl: ["Scrape", "Search"],
  Linear: ["Create Ticket", "Find Issues"],
  Resend: ["Send Email"],
  Slack: ["Send Slack Message"],
  "Google Workspace": [
    "Send Gmail",
    "Create Google Calendar Event",
    "Upload Drive File",
    "Read Gmail",
    "List Google Calendar Events",
    "Search Drive",
  ],
  "Microsoft 365": [
    "Send Outlook Email",
    "Create Teams Message",
    "Upload OneDrive File",
    "Create SharePoint Page",
    "Create Microsoft Event",
    "Read Outlook Email",
    "Search OneDrive",
    "List Microsoft Events",
  ],
} as const;

type ActionCategory = keyof typeof ACTION_CATEGORIES;

// Get category for an action type
const getCategoryForAction = (actionType: string): ActionCategory | null => {
  for (const [category, actions] of Object.entries(ACTION_CATEGORIES)) {
    if (actions.includes(actionType as never)) {
      return category as ActionCategory;
    }
  }
  return null;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Component inherently complex due to multiple action types
export function ActionConfig({
  config,
  onUpdateConfig,
  onUpdateConfigBatch,
  disabled,
}: ActionConfigProps) {
  const [_workflowId] = useAtom(currentWorkflowIdAtom);
  const [_workflowName] = useAtom(currentWorkflowNameAtom);
  const nodes = useAtomValue(nodesAtom);
  const edges = useAtomValue(edgesAtom);
  const selectedNodeId = useAtomValue(selectedNodeAtom);

  const actionType = (config?.actionType as string) || "";
  const selectedCategory = actionType ? getCategoryForAction(actionType) : null;
  const [category, setCategory] = useState<ActionCategory | "">(
    selectedCategory || ""
  );
  const upstreamNodes = useMemo(
    () => getUpstreamNodes(nodes, edges, selectedNodeId),
    [nodes, edges, selectedNodeId]
  );

  // Sync category state when actionType changes (e.g., when switching nodes)
  useEffect(() => {
    const newCategory = actionType ? getCategoryForAction(actionType) : null;
    setCategory(newCategory || "");
  }, [actionType]);

  useEffect(() => {
    if (actionType === "Content Card" && !config.cardType) {
      onUpdateConfig("cardType", "text");
    }
  }, [actionType, config.cardType, onUpdateConfig]);

  useEffect(() => {
    if (actionType === "Content Card" && !config.imageSourceType) {
      onUpdateConfig("imageSourceType", "url");
    }
  }, [actionType, config.imageSourceType, onUpdateConfig]);

  const handleCategoryChange = (newCategory: ActionCategory) => {
    setCategory(newCategory);
    // Auto-select the first action in the new category
    const firstAction = ACTION_CATEGORIES[newCategory][0];
    onUpdateConfig("actionType", firstAction);
  };

  const handleActionTypeChange = (value: string) => {
    onUpdateConfig("actionType", value);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="ml-1" htmlFor="actionCategory">
            Category
          </Label>
          <Select
            disabled={disabled}
            onValueChange={(value) =>
              handleCategoryChange(value as ActionCategory)
            }
            value={category || undefined}
          >
            <SelectTrigger className="w-full" id="actionCategory">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="System">
                <div className="flex items-center gap-2">
                  <Settings className="size-4" />
                  <span>System</span>
                </div>
              </SelectItem>
              <SelectItem value="AI Gateway">
                <div className="flex items-center gap-2">
                  <IntegrationIcon className="size-4" integration="vercel" />
                  <span>AI Gateway</span>
                </div>
              </SelectItem>
              <SelectItem value="Linear">
                <div className="flex items-center gap-2">
                  <IntegrationIcon className="size-4" integration="linear" />
                  <span>Linear</span>
                </div>
              </SelectItem>
              <SelectItem value="Resend">
                <div className="flex items-center gap-2">
                  <IntegrationIcon className="size-4" integration="resend" />
                  <span>Resend</span>
                </div>
              </SelectItem>
              <SelectItem value="Slack">
                <div className="flex items-center gap-2">
                  <IntegrationIcon className="size-4" integration="slack" />
                  <span>Slack</span>
                </div>
              </SelectItem>
              <SelectItem value="Firecrawl">
                <div className="flex items-center gap-2">
                  <IntegrationIcon className="size-4" integration="firecrawl" />
                  <span>Firecrawl</span>
                </div>
              </SelectItem>
              <SelectItem value="Google Workspace">
                <div className="flex items-center gap-2">
                  <IntegrationIcon className="size-4" integration="google" />
                  <span>Google Workspace</span>
                </div>
              </SelectItem>
              <SelectItem value="Microsoft 365">
                <div className="flex items-center gap-2">
                  <IntegrationIcon className="size-4" integration="microsoft" />
                  <span>Microsoft 365</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="ml-1" htmlFor="actionType">
            Action
          </Label>
          <Select
            disabled={disabled || !category}
            onValueChange={handleActionTypeChange}
            value={actionType || undefined}
          >
            <SelectTrigger className="w-full" id="actionType">
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              {category &&
                ACTION_CATEGORIES[category].map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Send Email fields */}
      {config?.actionType === "Send Email" && (
        <SendEmailFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}

      {/* Send Slack Message fields */}
      {config?.actionType === "Send Slack Message" && (
        <SendSlackMessageFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}

      {/* Create Ticket fields */}
      {config?.actionType === "Create Ticket" && (
        <CreateTicketFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}

      {/* Find Issues fields */}
      {config?.actionType === "Find Issues" && (
        <FindIssuesFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}

      {/* Database Query fields */}
      {config?.actionType === "Database Query" && (
        <DatabaseQueryFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}

      {/* HTTP Request fields */}
      {config?.actionType === "HTTP Request" && (
        <HttpRequestFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}

      {/* Generate Text fields */}
      {config?.actionType === "Generate Text" && (
        <GenerateTextFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}

      {/* Generate Image fields */}
      {config?.actionType === "Generate Image" && (
        <GenerateImageFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}

      {/* Content Card fields */}
      {config?.actionType === "Content Card" && (
        <ContentCardFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
          onUpdateConfigBatch={onUpdateConfigBatch}
          upstreamNodes={upstreamNodes}
        />
      )}

      {/* Google Workspace */}
      {config?.actionType === "Send Gmail" && (
        <SendGmailFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}
      {config?.actionType === "Create Google Calendar Event" && (
        <GoogleCalendarFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}
      {config?.actionType === "Upload Drive File" && (
        <GoogleDriveUploadFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}

      {/* Microsoft 365 */}
      {config?.actionType === "Send Outlook Email" && (
        <SendOutlookFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}
      {config?.actionType === "Create Teams Message" && (
        <TeamsMessageFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}
      {config?.actionType === "Upload OneDrive File" && (
        <OneDriveUploadFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}
      {config?.actionType === "Create SharePoint Page" && (
        <SharePointPageFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}
      {config?.actionType === "Create Microsoft Event" && (
        <MicrosoftEventFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}

      {/* Condition fields */}
      {config?.actionType === "Condition" && (
        <ConditionFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}

      {/* Scrape fields */}
      {config?.actionType === "Scrape" && (
        <ScrapeFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}

      {/* Search fields */}
      {config?.actionType === "Search" && (
        <SearchFields
          config={config}
          disabled={disabled}
          onUpdateConfig={onUpdateConfig}
        />
      )}
    </>
  );
}
