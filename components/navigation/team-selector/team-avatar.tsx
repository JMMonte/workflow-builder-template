"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getIconColors, getIconOption } from "@/components/ui/icon-options";
import type { TeamAvatarTeam } from "./types";

type TeamAvatarProps = {
  team: TeamAvatarTeam;
  size?: "sm" | "md" | "lg";
};

const avatarSizes: Record<NonNullable<TeamAvatarProps["size"]>, string> = {
  sm: "h-6 w-6 text-[11px]",
  md: "h-8 w-8 text-xs",
  lg: "h-12 w-12 text-sm",
};

export function TeamAvatar({ team, size = "md" }: TeamAvatarProps) {
  const avatarKey =
    team.id ?? `${team.name}-${team.icon ?? "initial"}-${team.imageUrl ?? ""}`;

  const hasIcon = Boolean(team.icon);
  const iconOption = hasIcon ? getIconOption(team.icon, "users") : null;
  const iconColors = hasIcon ? getIconColors(team.iconColor) : null;

  return (
    <Avatar
      className={`shrink-0 rounded-md ${avatarSizes[size]}`}
      key={avatarKey}
    >
      {team.imageUrl ? (
        <AvatarImage alt={`${team.name} logo`} src={team.imageUrl} />
      ) : null}
      <AvatarFallback
        className="flex h-full w-full items-center justify-center rounded-md"
        style={
          iconColors
            ? {
                color: iconColors.color,
                backgroundColor: iconColors.backgroundColor,
              }
            : {
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              }
        }
      >
        {iconOption ? (
          <iconOption.Icon
            className="size-4"
            color={iconColors?.color || undefined}
          />
        ) : (
          team.name?.charAt(0).toUpperCase() || "T"
        )}
      </AvatarFallback>
    </Avatar>
  );
}
