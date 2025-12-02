import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateMicrosoftEventConfigFields({
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
        <Label htmlFor="ms-event-title">Title</Label>
        <Input
          disabled={disabled}
          id="ms-event-title"
          onChange={(e) => onUpdateConfig("title", e.target.value)}
          placeholder="Meeting title"
          value={(config.title as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ms-event-start">Start (ISO)</Label>
        <Input
          disabled={disabled}
          id="ms-event-start"
          onChange={(e) => onUpdateConfig("start", e.target.value)}
          placeholder="2025-01-01T10:00:00Z"
          value={(config.start as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ms-event-end">End (ISO)</Label>
        <Input
          disabled={disabled}
          id="ms-event-end"
          onChange={(e) => onUpdateConfig("end", e.target.value)}
          placeholder="2025-01-01T11:00:00Z"
          value={(config.end as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ms-event-description">Description</Label>
        <Textarea
          disabled={disabled}
          id="ms-event-description"
          onChange={(e) => onUpdateConfig("description", e.target.value)}
          placeholder="Agenda and details"
          rows={3}
          value={(config.description as string) || ""}
        />
      </div>
    </div>
  );
}
