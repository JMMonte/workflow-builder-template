import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReadGmailConfigFields({
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
        <Label htmlFor="gmail-query">Search Query</Label>
        <Input
          disabled={disabled}
          id="gmail-query"
          onChange={(e) => onUpdateConfig("query", e.target.value)}
          placeholder="from:user@example.com is:unread newer_than:7d"
          value={(config.query as string) || ""}
        />
        <p className="text-muted-foreground text-xs">
          Use Gmail search syntax. Add time bounds like newer_than:7d or
          after:2025/01/01 before:2025/02/01 for predictable slices.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="gmail-max-results">Max Results</Label>
        <Input
          disabled={disabled}
          id="gmail-max-results"
          onChange={(e) => onUpdateConfig("maxResults", e.target.value)}
          placeholder="10"
          type="number"
          value={(config.maxResults as string) || ""}
        />
      </div>
    </div>
  );
}
