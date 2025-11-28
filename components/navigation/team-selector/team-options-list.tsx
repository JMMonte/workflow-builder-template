"use client";

import { Plus, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Team } from "@/lib/api-client";

import { TeamAvatar } from "./team-avatar";

type TeamOptionsListProps = {
  teams: Team[];
  onCreate: () => void;
  onSettings: () => void;
  settingsDisabled: boolean;
};

export function TeamOptionsList({
  teams,
  onCreate,
  onSettings,
  settingsDisabled,
}: TeamOptionsListProps) {
  return (
    <>
      {teams.map((team) => (
        <SelectItem key={team.id} value={team.id}>
          <div className="flex items-center gap-2">
            <TeamAvatar size="sm" team={team} />
            <div className="flex flex-col">
              <span className="font-medium text-foreground text-sm">
                {team.name}
              </span>
              <span className="text-muted-foreground text-xs capitalize">
                {team.role}
              </span>
            </div>
          </div>
        </SelectItem>
      ))}
      <Separator className="my-1" />
      <div className="px-1 py-1">
        <Button
          className="w-full justify-start"
          onClick={onCreate}
          size="sm"
          variant="ghost"
        >
          <Plus className="mr-2 size-4" />
          Create team
        </Button>
        <Button
          className="w-full justify-start"
          disabled={settingsDisabled}
          onClick={onSettings}
          size="sm"
          variant="ghost"
        >
          <Settings className="mr-2 size-4" />
          Team settings
        </Button>
      </div>
    </>
  );
}
