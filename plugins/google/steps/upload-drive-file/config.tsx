import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UploadDriveFileConfigFields({
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
        <Label htmlFor="drive-file-url">File URL</Label>
        <Input
          disabled={disabled}
          id="drive-file-url"
          onChange={(e) => onUpdateConfig("fileUrl", e.target.value)}
          placeholder="https://example.com/file.pdf"
          value={(config.fileUrl as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="drive-folder-id">Destination Folder ID (optional)</Label>
        <Input
          disabled={disabled}
          id="drive-folder-id"
          onChange={(e) => onUpdateConfig("folderId", e.target.value)}
          placeholder="drive-folder-id"
          value={(config.folderId as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="drive-mime-type">MIME Type</Label>
        <Input
          disabled={disabled}
          id="drive-mime-type"
          onChange={(e) => onUpdateConfig("mimeType", e.target.value)}
          placeholder="application/pdf"
          value={(config.mimeType as string) || ""}
        />
      </div>
    </div>
  );
}
