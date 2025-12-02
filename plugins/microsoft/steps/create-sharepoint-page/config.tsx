import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateSharePointPageConfigFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="sharepoint-site-id">Site ID</Label>
        <Input
          disabled={disabled}
          id="sharepoint-site-id"
          onChange={(e) => onUpdateConfig("siteId", e.target.value)}
          placeholder="site-id"
          value={(config.siteId as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sharepoint-title">Title</Label>
        <Input
          disabled={disabled}
          id="sharepoint-title"
          onChange={(e) => onUpdateConfig("title", e.target.value)}
          placeholder="New page title"
          value={(config.title as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sharepoint-content">Content</Label>
        <Textarea
          disabled={disabled}
          id="sharepoint-content"
          onChange={(e) => onUpdateConfig("content", e.target.value)}
          placeholder="Page content"
          rows={4}
          value={(config.content as string) || ""}
        />
      </div>
    </div>
  );
}
