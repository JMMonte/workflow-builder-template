"use client";

import { Select, SelectContent, SelectTrigger } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Team } from "@/lib/api-client";
import { TeamAvatar } from "./team-avatar";
import { TeamOptionsList } from "./team-options-list";
import type { TeamAvatarTeam } from "./types";

type CollapsedTeamPickerProps = {
  activeTeam: Team | null;
  activeTeamId: string | null;
  teams: Team[];
  onChange: (teamId: string) => void;
  onCreate: () => void;
  onSettings: () => void;
  settingsDisabled: boolean;
};

export function CollapsedTeamPicker({
  activeTeam,
  activeTeamId,
  teams,
  onChange,
  onCreate,
  onSettings,
  settingsDisabled,
}: CollapsedTeamPickerProps) {
  const displayTeam: TeamAvatarTeam = activeTeam || {
    name: "Team",
    icon: null,
    iconColor: null,
    imageUrl: null,
  };

  const trigger = (
    <SelectTrigger className="h-10 max-h-10 min-h-10 w-10 min-w-10 max-w-10 shrink-0 cursor-pointer border-none bg-sidebar p-0 text-foreground transition-colors hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent [&>span]:hidden">
      <TeamAvatar size="md" team={displayTeam} />
    </SelectTrigger>
  );

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Select onValueChange={onChange} value={activeTeamId || ""}>
          {trigger}
          <SelectContent align="start" side="right">
            <TeamOptionsList
              onCreate={onCreate}
              onSettings={onSettings}
              settingsDisabled={settingsDisabled}
              teams={teams}
            />
          </SelectContent>
        </Select>
      </TooltipTrigger>
      <TooltipContent side="right">{displayTeam.name || "Team"}</TooltipContent>
    </Tooltip>
  );
}
