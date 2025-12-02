import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateGoogleEventConfigFields({
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
        <Label htmlFor="google-event-title">Title</Label>
        <Input
          disabled={disabled}
          id="google-event-title"
          onChange={(e) => onUpdateConfig("title", e.target.value)}
          placeholder="Team Sync"
          value={(config.title as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="google-event-start">Start (ISO)</Label>
        <Input
          disabled={disabled}
          id="google-event-start"
          onChange={(e) => onUpdateConfig("start", e.target.value)}
          placeholder="2025-01-01T10:00:00Z"
          value={(config.start as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="google-event-end">End (ISO)</Label>
        <Input
          disabled={disabled}
          id="google-event-end"
          onChange={(e) => onUpdateConfig("end", e.target.value)}
          placeholder="2025-01-01T11:00:00Z"
          value={(config.end as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="google-event-description">Description</Label>
        <Textarea
          disabled={disabled}
          id="google-event-description"
          onChange={(e) => onUpdateConfig("description", e.target.value)}
          placeholder="Agenda and details"
          rows={3}
          value={(config.description as string) || ""}
        />
      </div>
    </div>
  );
}
