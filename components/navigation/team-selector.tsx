"use client";

import {
  Briefcase,
  Building2,
  type LucideIcon,
  Plus,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api, TEAM_STORAGE_KEY, type Team } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";

type TeamSelectorProps = {
  collapsed?: boolean;
};

const DEFAULT_TEAM_ICON_COLOR = "#2563eb";

type TeamIconOption = {
  value: string;
  label: string;
  Icon: LucideIcon;
};

const TEAM_ICON_OPTIONS: TeamIconOption[] = [
  { value: "users", label: "Team", Icon: Users },
  { value: "building-2", label: "Workspace", Icon: Building2 },
  { value: "briefcase", label: "Operations", Icon: Briefcase },
  { value: "sparkles", label: "AI", Icon: Sparkles },
  { value: "rocket", label: "Launch", Icon: Rocket },
  { value: "shield-check", label: "Security", Icon: ShieldCheck },
];

type TeamAvatarTeam = {
  id?: string;
  name: string;
  icon?: string | null;
  iconColor?: string | null;
  imageUrl?: string | null;
};

const HEX_REGEX = /^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/;

function normalizeHex(color?: string | null) {
  if (!color?.trim()) {
    return null;
  }

  const match = color.trim().match(HEX_REGEX);
  if (!match) {
    return null;
  }

  let hex = match[1];
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  return `#${hex}`;
}

function colorWithAlpha(hex: string, alpha = 0.12) {
  const normalized = hex.replace("#", "");
  const int = Number.parseInt(normalized, 16);
  const r = Math.floor(int / 65_536) % 256;
  const g = Math.floor(int / 256) % 256;
  const b = int % 256;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getTeamIconOption(value?: string | null): TeamIconOption {
  return (
    TEAM_ICON_OPTIONS.find((option) => option.value === value) ||
    TEAM_ICON_OPTIONS[0]
  );
}

function getTeamIconColors(iconColor?: string | null) {
  const normalizedHex = normalizeHex(iconColor) || DEFAULT_TEAM_ICON_COLOR;
  const backgroundTint = colorWithAlpha(normalizedHex, 0.12);

  return {
    color: normalizedHex,
    backgroundColor: backgroundTint,
  };
}

function TeamAvatar({
  team,
  size = "md",
}: {
  team: TeamAvatarTeam;
  size?: "sm" | "md" | "lg";
}) {
  const avatarKey =
    team.id ?? `${team.name}-${team.icon ?? "initial"}-${team.imageUrl ?? ""}`;
  const sizes: Record<"sm" | "md" | "lg", string> = {
    sm: "h-6 w-6 text-[11px]",
    md: "h-8 w-8 text-xs",
    lg: "h-12 w-12 text-sm",
  };

  const hasIcon = Boolean(team.icon);
  const iconOption = hasIcon ? getTeamIconOption(team.icon) : null;
  const iconColors = hasIcon ? getTeamIconColors(team.iconColor) : null;

  return (
    <Avatar className={`shrink-0 rounded-md ${sizes[size]}`} key={avatarKey}>
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

function TeamBrandingFields({
  colorInputId,
  disabled,
  icon,
  iconColor,
  iconInputId,
  imageInputId,
  imageUrl,
  name,
  onIconChange,
  onIconColorChange,
  onImageUrlChange,
}: {
  colorInputId: string;
  disabled?: boolean;
  icon: string;
  iconColor: string;
  iconInputId: string;
  imageInputId: string;
  imageUrl: string;
  name: string;
  onIconChange: (value: string) => void;
  onIconColorChange: (value: string) => void;
  onImageUrlChange: (value: string) => void;
}) {
  const previewTeam = {
    name: name || "Team",
    icon,
    iconColor,
    imageUrl,
  };
  const resolvedIconColor = iconColor || DEFAULT_TEAM_ICON_COLOR;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={imageInputId}>Team image</Label>
        <div className="flex items-center gap-3">
          <TeamAvatar size="lg" team={previewTeam} />
          <div className="flex-1 space-y-2">
            <Input
              autoComplete="url"
              disabled={disabled}
              id={imageInputId}
              onChange={(e) => onImageUrlChange(e.target.value)}
              placeholder="https://example.com/team-logo.png"
              type="url"
              value={imageUrl}
            />
            <p className="text-muted-foreground text-xs">
              Add a public image URL for your team. Leave empty to use an icon.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr,auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor={iconInputId}>Team icon</Label>
          <div className="flex items-center gap-2">
            <Select
              disabled={disabled}
              onValueChange={onIconChange}
              value={icon || undefined}
            >
              <SelectTrigger id={iconInputId}>
                <SelectValue placeholder="Use initials" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_ICON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.Icon className="size-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={disabled}
              onClick={() => {
                onIconChange("");
                onIconColorChange("");
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              Clear
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Choose an icon or clear to use the team initial.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={colorInputId}>Icon color</Label>
          <div className="flex items-center gap-2">
            <Input
              className="h-10 w-16 p-1"
              disabled={disabled || !icon}
              id={colorInputId}
              onChange={(e) => onIconColorChange(e.target.value)}
              type="color"
              value={resolvedIconColor}
            />
            <Button
              disabled={disabled || !icon}
              onClick={() => onIconColorChange("")}
              size="sm"
              type="button"
              variant="ghost"
            >
              Reset
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Icon color applies when no image is set.
          </p>
        </div>
      </div>
    </div>
  );
}

function TeamOptionsList({
  teams,
  onCreate,
  onSettings,
  settingsDisabled,
}: {
  teams: Team[];
  onCreate: () => void;
  onSettings: () => void;
  settingsDisabled: boolean;
}) {
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

function CreateTeamDialog({
  open,
  onOpenChange,
  newTeamName,
  newTeamIcon,
  newTeamIconColor,
  newTeamImageUrl,
  onNameChange,
  onIconChange,
  onIconColorChange,
  onImageUrlChange,
  creating,
  onCreate,
  inputId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newTeamName: string;
  newTeamIcon: string;
  newTeamIconColor: string;
  newTeamImageUrl: string;
  onNameChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onIconColorChange: (value: string) => void;
  onImageUrlChange: (value: string) => void;
  creating: boolean;
  onCreate: () => void;
  inputId: string;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create team</DialogTitle>
          <DialogDescription>
            Create a new team for your workflows and integrations.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={inputId}>Team name</Label>
            <Input
              id={inputId}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Marketing team"
              value={newTeamName}
            />
          </div>
          <TeamBrandingFields
            colorInputId={`${inputId}-icon-color`}
            disabled={creating}
            icon={newTeamIcon}
            iconColor={newTeamIconColor}
            iconInputId={`${inputId}-icon`}
            imageInputId={`${inputId}-image`}
            imageUrl={newTeamImageUrl}
            name={newTeamName}
            onIconChange={onIconChange}
            onIconColorChange={onIconColorChange}
            onImageUrlChange={onImageUrlChange}
          />
        </div>
        <DialogFooter>
          <Button disabled={creating || !newTeamName.trim()} onClick={onCreate}>
            {creating ? <Spinner className="mr-2 size-4" /> : null}
            Create team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TeamSettingsModal({
  open,
  onOpenChange,
  activeTeam,
  renameDraft,
  onRenameChange,
  saving,
  onSave,
  deleting,
  onDelete,
  icon,
  onIconChange,
  iconColor,
  onIconColorChange,
  imageUrl,
  onImageUrlChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTeam: Team | null;
  renameDraft: string;
  onRenameChange: (value: string) => void;
  saving: boolean;
  onSave: () => void;
  deleting: boolean;
  onDelete: () => void;
  icon: string;
  onIconChange: (value: string) => void;
  iconColor: string;
  onIconColorChange: (value: string) => void;
  imageUrl: string;
  onImageUrlChange: (value: string) => void;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const canManageTeam = activeTeam?.role === "owner";

  if (!(activeTeam && canManageTeam)) {
    return null;
  }

  const trimmedName = renameDraft.trim();
  const normalize = (value?: string | null) => value?.trim() || "";
  const hasChanges =
    trimmedName.length > 0 &&
    (trimmedName !== activeTeam.name ||
      normalize(icon) !== normalize(activeTeam.icon) ||
      normalize(iconColor) !== normalize(activeTeam.iconColor) ||
      normalize(imageUrl) !== normalize(activeTeam.imageUrl));

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Team settings</DialogTitle>
            <DialogDescription>
              Manage settings for {activeTeam.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-rename">Team name</Label>
              <Input
                id="team-rename"
                onChange={(e) => onRenameChange(e.target.value)}
                placeholder="Team name"
                value={renameDraft}
              />
            </div>
            <TeamBrandingFields
              colorInputId="team-icon-color"
              disabled={saving || deleting}
              icon={icon}
              iconColor={iconColor}
              iconInputId="team-icon"
              imageInputId="team-image"
              imageUrl={imageUrl}
              name={renameDraft || activeTeam.name}
              onIconChange={onIconChange}
              onIconColorChange={onIconColorChange}
              onImageUrlChange={onImageUrlChange}
            />
          </div>
          <Separator />
          <DialogFooter className="flex-row justify-end">
            <Button
              disabled={deleting || saving}
              onClick={() => setDeleteDialogOpen(true)}
              variant="destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete team
            </Button>
            <Button
              disabled={saving || deleting || !hasChanges}
              onClick={onSave}
            >
              {saving ? <Spinner className="mr-2 size-4" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this team?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the team and revoke member access. Workflows or
              integrations should be moved or deleted first. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={() => {
                setDeleteDialogOpen(false);
                onOpenChange(false);
                onDelete();
              }}
            >
              {deleting ? <Spinner className="mr-2 size-4" /> : null}
              Delete team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CollapsedTeamPicker({
  activeTeam,
  activeTeamId,
  teams,
  onChange,
  onCreate,
  onSettings,
  settingsDisabled,
}: {
  activeTeam: Team | null;
  activeTeamId: string | null;
  teams: Team[];
  onChange: (teamId: string) => void;
  onCreate: () => void;
  onSettings: () => void;
  settingsDisabled: boolean;
}) {
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

function ExpandedTeamPicker({
  activeTeam,
  activeTeamId,
  teams,
  onChange,
  onCreate,
  onSettings,
  settingsDisabled,
}: {
  activeTeam: Team | null;
  activeTeamId: string | null;
  teams: Team[];
  onChange: (teamId: string) => void;
  onCreate: () => void;
  onSettings: () => void;
  settingsDisabled: boolean;
}) {
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

export function TeamSelector({ collapsed }: TeamSelectorProps) {
  const { data: session, isPending } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamIcon, setNewTeamIcon] = useState("");
  const [newTeamIconColor, setNewTeamIconColor] = useState(
    DEFAULT_TEAM_ICON_COLOR
  );
  const [newTeamImageUrl, setNewTeamImageUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [settingsIcon, setSettingsIcon] = useState("");
  const [settingsIconColor, setSettingsIconColor] = useState("");
  const [settingsImageUrl, setSettingsImageUrl] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const activeTeam = teams.find((team) => team.id === activeTeamId) || null;
  const canManageTeam = activeTeam?.role === "owner";

  const pickActiveTeamId = useCallback(
    (teamsList: Team[], preferredId?: string | null) => {
      if (preferredId && teamsList.some((team) => team.id === preferredId)) {
        return preferredId;
      }

      const storedId =
        typeof window !== "undefined"
          ? window.localStorage.getItem(TEAM_STORAGE_KEY)
          : null;

      if (storedId && teamsList.some((team) => team.id === storedId)) {
        return storedId;
      }

      return teamsList[0]?.id || null;
    },
    []
  );

  const loadTeams = useCallback(
    async (preferredId?: string | null) => {
      try {
        setLoading(true);
        const data = await api.team.list();
        setTeams(data);

        const nextId = pickActiveTeamId(data, preferredId);
        setActiveTeamId(nextId);

        if (nextId) {
          api.team.setActiveTeam(nextId);
        }
      } catch (error) {
        console.error("Failed to load teams:", error);
        toast.error("Failed to load teams");
      } finally {
        setLoading(false);
      }
    },
    [pickActiveTeamId]
  );

  useEffect(() => {
    if (isPending || !session?.user) {
      setLoading(false);
      return;
    }

    loadTeams();
  }, [isPending, loadTeams, session?.user]);

  useEffect(() => {
    setRenameDraft(activeTeam?.name || "");
    setSettingsIcon(activeTeam?.icon || "");
    setSettingsIconColor(activeTeam?.iconColor || "");
    setSettingsImageUrl(activeTeam?.imageUrl || "");
  }, [activeTeam]);

  const handleTeamChange = (teamId: string) => {
    setActiveTeamId(teamId);
    api.team.setActiveTeam(teamId);
  };

  const handleCreateTeam = async () => {
    const trimmedName = newTeamName.trim();

    if (!trimmedName) {
      toast.error("Enter a team name");
      return;
    }

    try {
      setCreating(true);
      const created = await api.team.create({
        name: trimmedName,
        icon: newTeamIcon || null,
        iconColor:
          newTeamIcon && newTeamIconColor.trim()
            ? newTeamIconColor.trim()
            : null,
        imageUrl: newTeamImageUrl.trim() || null,
      });
      await loadTeams(created.id);
      setNewTeamName("");
      setNewTeamIcon("");
      setNewTeamIconColor(DEFAULT_TEAM_ICON_COLOR);
      setNewTeamImageUrl("");
      setCreateDialogOpen(false);
      toast.success("Team created");
    } catch (error) {
      console.error("Failed to create team:", error);
      toast.error("Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenCreateDialog = useCallback(() => {
    setNewTeamName("");
    setNewTeamIcon("");
    setNewTeamIconColor(DEFAULT_TEAM_ICON_COLOR);
    setNewTeamImageUrl("");
    setCreateDialogOpen(true);
  }, []);

  const handleOpenSettings = useCallback(() => {
    if (!activeTeam) {
      toast.error("Select a team first");
      return;
    }

    if (!canManageTeam) {
      toast.error("Only team owners can manage team settings");
      return;
    }

    setRenameDraft(activeTeam.name);
    setSettingsIcon(activeTeam.icon || "");
    setSettingsIconColor(activeTeam.iconColor || "");
    setSettingsImageUrl(activeTeam.imageUrl || "");
    setSettingsOpen(true);
  }, [activeTeam, canManageTeam]);

  const handleSaveTeamSettings = async () => {
    if (!activeTeam?.id) {
      return;
    }

    const trimmedName = renameDraft.trim();

    if (!trimmedName) {
      toast.error("Enter a team name");
      return;
    }

    try {
      setSavingSettings(true);
      await api.team.update(activeTeam.id, {
        name: trimmedName,
        icon: settingsIcon || null,
        iconColor:
          settingsIcon && settingsIconColor.trim()
            ? settingsIconColor.trim()
            : null,
        imageUrl: settingsImageUrl.trim() || null,
      });
      await loadTeams(activeTeam.id);
      setSettingsOpen(false);
      toast.success("Team updated");
    } catch (error) {
      console.error("Failed to update team:", error);
      toast.error("Failed to update team");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!activeTeam?.id) {
      return;
    }

    try {
      setDeleting(true);
      await api.team.delete(activeTeam.id);
      setSettingsOpen(false);
      toast.success("Team deleted");
      await loadTeams();
    } catch (error) {
      console.error("Failed to delete team:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete team"
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!session?.user || teams.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center px-3 py-2">
        <Spinner className="size-4" />
      </div>
    );
  }

  const createTeamDialog = (
    <CreateTeamDialog
      creating={creating}
      inputId={collapsed ? "team-name" : "team-name-expanded"}
      newTeamIcon={newTeamIcon}
      newTeamIconColor={newTeamIconColor}
      newTeamImageUrl={newTeamImageUrl}
      newTeamName={newTeamName}
      onCreate={handleCreateTeam}
      onIconChange={setNewTeamIcon}
      onIconColorChange={setNewTeamIconColor}
      onImageUrlChange={setNewTeamImageUrl}
      onNameChange={setNewTeamName}
      onOpenChange={setCreateDialogOpen}
      open={createDialogOpen}
    />
  );

  const teamSettingsModal = (
    <TeamSettingsModal
      activeTeam={activeTeam}
      deleting={deleting}
      icon={settingsIcon}
      iconColor={settingsIconColor}
      imageUrl={settingsImageUrl}
      onDelete={handleDeleteTeam}
      onIconChange={setSettingsIcon}
      onIconColorChange={setSettingsIconColor}
      onImageUrlChange={setSettingsImageUrl}
      onOpenChange={setSettingsOpen}
      onRenameChange={setRenameDraft}
      onSave={handleSaveTeamSettings}
      open={settingsOpen}
      renameDraft={renameDraft}
      saving={savingSettings}
    />
  );

  if (collapsed) {
    return (
      <>
        <CollapsedTeamPicker
          activeTeam={activeTeam}
          activeTeamId={activeTeamId}
          onChange={handleTeamChange}
          onCreate={handleOpenCreateDialog}
          onSettings={handleOpenSettings}
          settingsDisabled={!activeTeam}
          teams={teams}
        />
        {createTeamDialog}
        {teamSettingsModal}
      </>
    );
  }

  return (
    <>
      <ExpandedTeamPicker
        activeTeam={activeTeam}
        activeTeamId={activeTeamId}
        onChange={handleTeamChange}
        onCreate={handleOpenCreateDialog}
        onSettings={handleOpenSettings}
        settingsDisabled={!activeTeam}
        teams={teams}
      />
      {createTeamDialog}
      {teamSettingsModal}
    </>
  );
}
