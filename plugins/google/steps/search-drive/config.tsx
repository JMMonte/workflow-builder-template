import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SearchDriveConfigFields({
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
        <Label htmlFor="drive-query">Search Query</Label>
        <Input
          disabled={disabled}
          id="drive-query"
          onChange={(e) => onUpdateConfig("query", e.target.value)}
          placeholder="fullText contains 'report'"
          value={(config.query as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="drive-limit">Max Results</Label>
        <Input
          disabled={disabled}
          id="drive-limit"
          onChange={(e) => onUpdateConfig("limit", e.target.value)}
          placeholder="10"
          type="number"
          value={(config.limit as string) || ""}
        />
      </div>
    </div>
  );
}
