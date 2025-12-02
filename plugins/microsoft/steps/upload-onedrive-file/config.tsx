import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UploadOneDriveFileConfigFields({
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
        <Label htmlFor="onedrive-file-url">File URL</Label>
        <Input
          disabled={disabled}
          id="onedrive-file-url"
          onChange={(e) => onUpdateConfig("fileUrl", e.target.value)}
          placeholder="https://example.com/file.pdf"
          value={(config.fileUrl as string) || ""}
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
    </div>
  );
}
