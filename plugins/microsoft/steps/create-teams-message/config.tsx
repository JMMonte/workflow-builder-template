import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateTeamsMessageConfigFields({
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
        <Label htmlFor="teams-team-id">Team ID</Label>
        <Input
          disabled={disabled}
          id="teams-team-id"
          onChange={(e) => onUpdateConfig("teamId", e.target.value)}
          placeholder="team-id"
          value={(config.teamId as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="teams-channel-id">Channel ID</Label>
        <Input
          disabled={disabled}
          id="teams-channel-id"
          onChange={(e) => onUpdateConfig("channelId", e.target.value)}
          placeholder="channel-id"
          value={(config.channelId as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="teams-content">Message</Label>
        <Textarea
          disabled={disabled}
          id="teams-content"
          onChange={(e) => onUpdateConfig("content", e.target.value)}
          placeholder="Hello team..."
          rows={3}
          value={(config.content as string) || ""}
        />
      </div>
    </div>
  );
}
