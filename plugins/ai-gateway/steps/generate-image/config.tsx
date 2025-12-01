import { Label } from "@/components/ui/label";
import { TemplateBadgeTextarea } from "@/components/ui/template-badge-textarea";
import {
  AiGatewayModelSelect,
} from "@/components/workflow/config/ai-gateway-model-select";

/**
 * Generate Image Config Fields Component
 */
export function GenerateImageConfigFields({
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
        <Label htmlFor="imageModel">Model</Label>
        <AiGatewayModelSelect
          disabled={disabled}
          integrationId={(config?.integrationId as string) || undefined}
          modelType="image"
          onChange={(value) => onUpdateConfig("imageModel", value)}
          placeholder="Select model"
          selectId="imageModel"
          value={
            (config?.imageModel as string) || "google/imagen-4.0-generate"
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="imagePrompt">Prompt</Label>
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
        <Label htmlFor="imageReference">Reference Image (optional)</Label>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="imageReference"
          onChange={(value) => onUpdateConfig("imageReference", value)}
          placeholder="Paste a URL, base64 string, or template reference for an existing image."
          rows={3}
          value={(config?.imageReference as string) || ""}
        />
      </div>
    </>
  );
}
