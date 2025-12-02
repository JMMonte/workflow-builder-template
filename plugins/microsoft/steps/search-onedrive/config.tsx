import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SearchOneDriveConfigFields({
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
        <Label htmlFor="onedrive-query">Search Query</Label>
        <Input
          disabled={disabled}
          id="onedrive-query"
          onChange={(e) => onUpdateConfig("query", e.target.value)}
          placeholder="file:report"
          value={(config.query as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="onedrive-folder-path">Folder Path (optional)</Label>
        <Input
          disabled={disabled}
          id="onedrive-folder-path"
          onChange={(e) => onUpdateConfig("folderPath", e.target.value)}
          placeholder="/Documents"
          value={(config.folderPath as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="onedrive-max-results">Max Results</Label>
        <Input
          disabled={disabled}
          id="onedrive-max-results"
          onChange={(e) => onUpdateConfig("maxResults", e.target.value)}
          placeholder="20"
          type="number"
          value={(config.maxResults as string) || ""}
        />
      </div>
    </div>
  );
}
