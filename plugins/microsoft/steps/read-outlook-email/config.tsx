import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReadOutlookEmailConfigFields({
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
        <Label htmlFor="outlook-query">Search Query</Label>
        <Input
          disabled={disabled}
          id="outlook-query"
          onChange={(e) => onUpdateConfig("query", e.target.value)}
          placeholder="from:user@example.com AND isread:false AND received:>=2025-01-01"
          value={(config.query as string) || ""}
        />
        <p className="text-muted-foreground text-xs">
          Use Graph OData filter syntax; add received:&gt;= and
          received:&lt;= for time bounds.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="outlook-folder">Folder (optional)</Label>
        <Input
          disabled={disabled}
          id="outlook-folder"
          onChange={(e) => onUpdateConfig("folder", e.target.value)}
          placeholder="Inbox"
          value={(config.folder as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="outlook-max-results">Max Results</Label>
        <Input
          disabled={disabled}
          id="outlook-max-results"
          onChange={(e) => onUpdateConfig("maxResults", e.target.value)}
          placeholder="10"
          type="number"
          value={(config.maxResults as string) || ""}
        />
      </div>
    </div>
  );
}
