import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateBadgeTextarea } from "@/components/ui/template-badge-textarea";
import {
  AiGatewayModelSelect,
} from "@/components/workflow/config/ai-gateway-model-select";
import { SchemaBuilder } from "@/components/workflow/config/schema-builder";

/**
 * Generate Text Config Fields Component
 */
export function GenerateTextConfigFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="aiFormat">Output Format</Label>
        <Select
          disabled={disabled}
          onValueChange={(value) => onUpdateConfig("aiFormat", value)}
          value={(config?.aiFormat as string) || "text"}
        >
          <SelectTrigger>
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
        <Label htmlFor="aiPrompt">Prompt</Label>
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
              config?.aiSchema ? JSON.parse(config.aiSchema as string) : []
            }
          />
        </div>
      )}
    </>
  );
}
