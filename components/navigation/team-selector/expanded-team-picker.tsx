"use client";

import { Select, SelectContent, SelectTrigger } from "@/components/ui/select";
import type { Team } from "@/lib/api-client";
import { TeamAvatar } from "./team-avatar";
import { TeamOptionsList } from "./team-options-list";
import type { TeamAvatarTeam } from "./types";

type ExpandedTeamPickerProps = {
  activeTeam: Team | null;
  activeTeamId: string | null;
  teams: Team[];
  onChange: (teamId: string) => void;
  onCreate: () => void;
  onSettings: () => void;
  settingsDisabled: boolean;
};

export function ExpandedTeamPicker({
  activeTeam,
  activeTeamId,
  teams,
  onChange,
  onCreate,
  onSettings,
  settingsDisabled,
}: ExpandedTeamPickerProps) {
  const displayTeam: TeamAvatarTeam = activeTeam || {
    name: "Team",
    icon: null,
    iconColor: null,
    imageUrl: null,
  };

  return (
    <Select onValueChange={onChange} value={activeTeamId || ""}>
      <SelectTrigger className="h-auto w-full cursor-pointer border-none bg-sidebar px-3 py-2 text-foreground transition-colors hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent">
        <div className="flex min-w-0 items-center gap-2">
          <TeamAvatar size="md" team={displayTeam} />
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate font-semibold text-foreground text-sm">
              {displayTeam.name || "Select team"}
            </p>
            <p className="truncate text-muted-foreground text-xs capitalize">
              {activeTeam?.role || "No team"}
            </p>
          </div>
        </div>
      </SelectTrigger>
      <SelectContent align="start">
        <TeamOptionsList
          onCreate={onCreate}
          onSettings={onSettings}
          settingsDisabled={settingsDisabled}
          teams={teams}
        />
      </SelectContent>
    </Select>
  );
}
