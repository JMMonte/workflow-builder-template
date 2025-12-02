import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SendOutlookEmailConfigFields({
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
        <Label htmlFor="outlook-to">To</Label>
        <Input
          disabled={disabled}
          id="outlook-to"
          onChange={(e) => onUpdateConfig("to", e.target.value)}
          placeholder="recipient@example.com"
          value={(config.to as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="outlook-subject">Subject</Label>
        <Input
          disabled={disabled}
          id="outlook-subject"
          onChange={(e) => onUpdateConfig("subject", e.target.value)}
          placeholder="Subject"
          value={(config.subject as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="outlook-body">Body</Label>
        <Textarea
          disabled={disabled}
          id="outlook-body"
          onChange={(e) => onUpdateConfig("body", e.target.value)}
          placeholder="Message body"
          rows={4}
          value={(config.body as string) || ""}
        />
      </div>
    </div>
  );
}
