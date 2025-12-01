"use client";

import { useAtom } from "jotai";
import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { edgesAtom, nodesAtom, selectedNodeAtom, type WorkflowNode } from "@/lib/workflow-store";

type SchemaField = {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  itemType?: "string" | "number" | "boolean" | "object";
  fields?: SchemaField[];
  description?: string;
};

// Helper to get a display name for a node
const getNodeDisplayName = (node: WorkflowNode): string => {
  if (node.data.label) {
    return node.data.label;
  }

  if (node.data.type === "action") {
    const actionType = node.data.config?.actionType as string | undefined;
    return actionType || "HTTP Request";
  }

  if (node.data.type === "trigger") {
    const triggerType = node.data.config?.triggerType as string | undefined;
    return triggerType || "Manual";
  }

  return "Node";
};

// Convert schema fields to field descriptions
const schemaToFields = (
  schema: SchemaField[],
  prefix = ""
): Array<{ field: string; description: string }> => {
  const fields: Array<{ field: string; description: string }> = [];

  for (const schemaField of schema) {
    const fieldPath = prefix
      ? `${prefix}.${schemaField.name}`
      : schemaField.name;
    const typeLabel =
      schemaField.type === "array"
        ? `${schemaField.itemType}[]`
        : schemaField.type;
    const description = schemaField.description || `${typeLabel}`;

    fields.push({ field: fieldPath, description });

    // Add nested fields for objects
    if (
      schemaField.type === "object" &&
      schemaField.fields &&
      schemaField.fields.length > 0
    ) {
      fields.push(...schemaToFields(schemaField.fields, fieldPath));
    }

    // Add nested fields for array items that are objects
    if (
      schemaField.type === "array" &&
      schemaField.itemType === "object" &&
      schemaField.fields &&
      schemaField.fields.length > 0
    ) {
      const arrayItemPath = `${fieldPath}[0]`;
      fields.push(...schemaToFields(schemaField.fields, arrayItemPath));
    }
  }

  return fields;
};

// Get common fields based on node action type
const getCommonFields = (node: WorkflowNode) => {
  const actionType = node.data.config?.actionType;

  if (actionType === "Find Issues") {
    return [
      { field: "issues", description: "Array of issues found" },
      { field: "count", description: "Number of issues" },
    ];
  }
  if (actionType === "Send Email") {
    return [
      { field: "id", description: "Email ID" },
      { field: "status", description: "Send status" },
    ];
  }
  if (actionType === "Create Ticket") {
    return [
      { field: "id", description: "Ticket ID" },
      { field: "url", description: "Ticket URL" },
      { field: "number", description: "Ticket number" },
    ];
  }
  if (actionType === "HTTP Request") {
    return [
      { field: "data", description: "Response data" },
      { field: "status", description: "HTTP status code" },
    ];
  }
  if (actionType === "Database Query") {
    const dbSchema = node.data.config?.dbSchema as string | undefined;

    // If schema is defined, show schema fields
    if (dbSchema) {
      try {
        const schema = JSON.parse(dbSchema) as SchemaField[];
        if (schema.length > 0) {
          return schemaToFields(schema);
        }
      } catch {
        // If schema parsing fails, fall through to default fields
      }
    }

    // Default fields when no schema
    return [
      { field: "rows", description: "Query result rows" },
      { field: "count", description: "Number of rows" },
    ];
  }
  if (actionType === "Generate Text") {
    const aiFormat = node.data.config?.aiFormat as string | undefined;
    const aiSchema = node.data.config?.aiSchema as string | undefined;

    // If format is object and schema is defined, show schema fields
    if (aiFormat === "object" && aiSchema) {
      try {
        const schema = JSON.parse(aiSchema) as SchemaField[];
        if (schema.length > 0) {
          return schemaToFields(schema);
        }
      } catch {
        // If schema parsing fails, fall through to default fields
      }
    }

    // Default fields for text format or when no schema
    return [
      { field: "text", description: "Generated text" },
      { field: "model", description: "Model used" },
    ];
  }
  if (actionType === "Generate Image") {
    return [
      { field: "base64", description: "Base64 image data" },
      { field: "reference", description: "Reference image input" },
      { field: "model", description: "Model used" },
    ];
  }
  if (actionType === "Content Card") {
    const cardType = node.data.config?.cardType as string;

    if (cardType === "image") {
      return [
        { field: "prompt", description: "Shared prompt text" },
        { field: "image", description: "Image data (URL or base64)" },
        { field: "url", description: "Image URL" },
        { field: "base64", description: "Base64 image data" },
      ];
    }

    return [
      { field: "prompt", description: "Shared prompt text" },
      { field: "text", description: "Text content" },
    ];
  }
  if (actionType === "Scrape") {
    return [
      { field: "markdown", description: "Scraped content as markdown" },
      { field: "metadata.url", description: "Page URL" },
      { field: "metadata.title", description: "Page title" },
      { field: "metadata.description", description: "Page description" },
      { field: "metadata.language", description: "Page language" },
      { field: "metadata.favicon", description: "Favicon URL" },
    ];
  }
  if (actionType === "Search") {
    return [{ field: "web", description: "Array of search results" }];
  }
  if (node.data.type === "trigger") {
    const triggerType = node.data.config?.triggerType as string | undefined;
    const webhookSchema = node.data.config?.webhookSchema as string | undefined;

    // If it's a webhook trigger with a schema, show schema fields
    if (triggerType === "Webhook" && webhookSchema) {
      try {
        const schema = JSON.parse(webhookSchema) as SchemaField[];
        if (schema.length > 0) {
          return schemaToFields(schema);
        }
      } catch {
        // If schema parsing fails, fall through to default fields
      }
    }

    // Default trigger fields
    return [
      { field: "triggered", description: "Trigger status" },
      { field: "timestamp", description: "Trigger timestamp" },
      { field: "input", description: "Input data" },
    ];
  }

  return [{ field: "data", description: "Output data" }];
};

type LabelWithVariablePickerProps = {
  htmlFor?: string;
  children: React.ReactNode;
  onVariableSelect: (template: string) => void;
  className?: string;
};

export function LabelWithVariablePicker({
  htmlFor,
  children,
  onVariableSelect,
  className,
}: LabelWithVariablePickerProps) {
  const [nodes] = useAtom(nodesAtom);
  const [edges] = useAtom(edgesAtom);
  const [selectedNodeId] = useAtom(selectedNodeAtom);
  const [open, setOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find all nodes that come before the current node
  const getUpstreamNodes = () => {
    if (!selectedNodeId) {
      return [];
    }

    const visited = new Set<string>();
    const upstream: string[] = [];

    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) {
        return;
      }
      visited.add(nodeId);

      const incomingEdges = edges.filter((edge) => edge.target === nodeId);
      for (const edge of incomingEdges) {
        upstream.push(edge.source);
        traverse(edge.source);
      }
    };

    traverse(selectedNodeId);

    return nodes.filter((node) => upstream.includes(node.id));
  };

  const upstreamNodes = getUpstreamNodes();

  // Build list of all available options (nodes + their fields)
  const options: Array<{
    type: "node" | "field";
    nodeId: string;
    nodeName: string;
    field?: string;
    description?: string;
    template: string;
  }> = [];

  for (const node of upstreamNodes) {
    const nodeName = getNodeDisplayName(node);
    const fields = getCommonFields(node);

    // Add node itself
    options.push({
      type: "node",
      nodeId: node.id,
      nodeName,
      template: `{{@${node.id}:${nodeName}}}`,
    });

    // Add fields
    for (const field of fields) {
      options.push({
        type: "field",
        nodeId: node.id,
        nodeName,
        field: field.field,
        description: field.description,
        template: `{{@${node.id}:${nodeName}.${field.field}}}`,
      });
    }
  }

  // Filter options based on search term
  const filteredOptions = searchFilter
    ? options.filter(
        (opt) =>
          opt.nodeName.toLowerCase().includes(searchFilter.toLowerCase()) ||
          (opt.field && opt.field.toLowerCase().includes(searchFilter.toLowerCase()))
      )
    : options;

  const handleSelect = (template: string) => {
    onVariableSelect(template);
    setOpen(false);
    setSearchFilter("");
  };

  // Focus search input when popover opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    } else {
      setSearchFilter("");
    }
  };

  // Don't show the button if there are no upstream nodes
  if (upstreamNodes.length === 0) {
    return <Label className={className} htmlFor={htmlFor}>{children}</Label>;
  }

  return (
    <div className="flex items-center justify-between">
      <Label className={className} htmlFor={htmlFor}>
        {children}
      </Label>
      <DropdownMenu onOpenChange={handleOpenChange} open={open}>
        <DropdownMenuTrigger asChild>
          <Button
            className="h-6 w-6"
            size="icon"
            type="button"
            variant="ghost"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="flex flex-col">
            <div className="border-b p-2">
              <input
                className="w-full bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search variables..."
                ref={searchInputRef}
                type="text"
                value={searchFilter}
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No variables found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    className="flex w-full cursor-pointer items-start rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    key={`${option.nodeId}-${option.field || "root"}`}
                    onClick={() => handleSelect(option.template)}
                    type="button"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {option.type === "node" ? (
                          option.nodeName
                        ) : (
                          <>
                            <span className="text-muted-foreground">
                              {option.nodeName}.
                            </span>
                            {option.field}
                          </>
                        )}
                      </div>
                      {option.description && (
                        <div className="text-muted-foreground text-xs">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
