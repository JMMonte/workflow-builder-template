"use client";

import { Plus, Settings, Trash2 } from "lucide-react";
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
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 font-semibold text-primary text-xs">
              {team.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{team.name}</span>
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
  onNameChange,
  creating,
  onCreate,
  inputId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newTeamName: string;
  onNameChange: (value: string) => void;
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
  renaming,
  onRename,
  deleting,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTeam: Team | null;
  renameDraft: string;
  onRenameChange: (value: string) => void;
  renaming: boolean;
  onRename: () => void;
  deleting: boolean;
  onDelete: () => void;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const canManageTeam = activeTeam?.role === "owner";

  if (!(activeTeam && canManageTeam)) {
    return null;
  }

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
          </div>
          <Separator />
          <DialogFooter className="flex-row justify-end">
            <Button
              disabled={deleting}
              onClick={() => setDeleteDialogOpen(true)}
              variant="destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete team
            </Button>
            <Button
              disabled={
                renaming ||
                !renameDraft.trim() ||
                renameDraft.trim() === activeTeam.name
              }
              onClick={onRename}
            >
              {renaming ? <Spinner className="mr-2 size-4" /> : null}
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
  const trigger = (
    <SelectTrigger className="h-10 max-h-10 min-h-10 w-10 min-w-10 max-w-10 shrink-0 cursor-pointer border-none p-0 transition-colors hover:bg-sidebar-accent [&>span]:hidden">
      <div className="flex h-8 min-h-8 w-8 min-w-8 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground text-xs">
        {activeTeam?.name.charAt(0).toUpperCase() || "T"}
      </div>
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
      <TooltipContent side="right">{activeTeam?.name || "Team"}</TooltipContent>
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
  return (
    <Select onValueChange={onChange} value={activeTeamId || ""}>
      <SelectTrigger className="h-auto w-full cursor-pointer border-none px-3 py-2 transition-colors hover:bg-sidebar-accent">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground text-xs">
            {activeTeam?.name.charAt(0).toUpperCase() || "T"}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate font-semibold text-sm">
              {activeTeam?.name || "Select team"}
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
  const [creating, setCreating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [renaming, setRenaming] = useState(false);
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
  }, [activeTeam]);

  const handleTeamChange = (teamId: string) => {
    setActiveTeamId(teamId);
    api.team.setActiveTeam(teamId);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error("Enter a team name");
      return;
    }

    try {
      setCreating(true);
      const created = await api.team.create(newTeamName.trim());
      await loadTeams(created.id);
      setNewTeamName("");
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
    setSettingsOpen(true);
  }, [activeTeam, canManageTeam]);

  const handleRenameTeam = async () => {
    if (!(activeTeam?.id && renameDraft.trim())) {
      toast.error("Enter a team name");
      return;
    }

    try {
      setRenaming(true);
      await api.team.update(activeTeam.id, renameDraft.trim());
      await loadTeams(activeTeam.id);
      setSettingsOpen(false);
      toast.success("Team name updated");
    } catch (error) {
      console.error("Failed to rename team:", error);
      toast.error("Failed to rename team");
    } finally {
      setRenaming(false);
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
      newTeamName={newTeamName}
      onCreate={handleCreateTeam}
      onNameChange={setNewTeamName}
      onOpenChange={setCreateDialogOpen}
      open={createDialogOpen}
    />
  );

  const teamSettingsModal = (
    <TeamSettingsModal
      activeTeam={activeTeam}
      deleting={deleting}
      onDelete={handleDeleteTeam}
      onOpenChange={setSettingsOpen}
      onRename={handleRenameTeam}
      onRenameChange={setRenameDraft}
      open={settingsOpen}
      renameDraft={renameDraft}
      renaming={renaming}
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
