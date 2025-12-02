import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ListMicrosoftEventsConfigFields({
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
        <Label htmlFor="ms-calendar-id">Calendar ID (optional)</Label>
        <Input
          disabled={disabled}
          id="ms-calendar-id"
          onChange={(e) => onUpdateConfig("calendarId", e.target.value)}
          placeholder="primary"
          value={(config.calendarId as string) || ""}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ms-time-min">Time Min (ISO)</Label>
          <Input
            disabled={disabled}
            id="ms-time-min"
            onChange={(e) => onUpdateConfig("timeMin", e.target.value)}
            placeholder="2025-01-01T00:00:00Z (recommended)"
            value={(config.timeMin as string) || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ms-time-max">Time Max (ISO)</Label>
          <Input
            disabled={disabled}
            id="ms-time-max"
            onChange={(e) => onUpdateConfig("timeMax", e.target.value)}
            placeholder="2025-02-01T00:00:00Z (recommended)"
            value={(config.timeMax as string) || ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ms-events-max">Max Results</Label>
        <Input
          disabled={disabled}
          id="ms-events-max"
          onChange={(e) => onUpdateConfig("maxResults", e.target.value)}
          placeholder="50"
          type="number"
          value={(config.maxResults as string) || ""}
        />
        <p className="text-muted-foreground text-xs">
          Provide timeMin/timeMax to bound the query; otherwise defaults to upcoming window.
        </p>
      </div>
    </div>
  );
}
