"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { DEFAULT_ICON_COLOR } from "@/components/ui/icon-options";
import { Spinner } from "@/components/ui/spinner";
import { api, TEAM_STORAGE_KEY, type Team } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";

import { CollapsedTeamPicker } from "./team-selector/collapsed-team-picker";
import { CreateTeamDialog } from "./team-selector/create-team-dialog";
import { ExpandedTeamPicker } from "./team-selector/expanded-team-picker";
import { TeamSettingsModal } from "./team-selector/team-settings-modal";

type TeamSelectorProps = {
  collapsed?: boolean;
};

export function TeamSelector({ collapsed }: TeamSelectorProps) {
  const { data: session, isPending } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamIcon, setNewTeamIcon] = useState("");
  const [newTeamIconColor, setNewTeamIconColor] = useState(DEFAULT_ICON_COLOR);
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

  const resetCreateState = useCallback(() => {
    setNewTeamName("");
    setNewTeamIcon("");
    setNewTeamIconColor(DEFAULT_ICON_COLOR);
    setNewTeamImageUrl("");
  }, []);

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
      resetCreateState();
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
    resetCreateState();
    setCreateDialogOpen(true);
  }, [resetCreateState]);

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

  return (
    <>
      {collapsed ? (
        <CollapsedTeamPicker
          activeTeam={activeTeam}
          activeTeamId={activeTeamId}
          onChange={handleTeamChange}
          onCreate={handleOpenCreateDialog}
          onSettings={handleOpenSettings}
          settingsDisabled={!activeTeam}
          teams={teams}
        />
      ) : (
        <ExpandedTeamPicker
          activeTeam={activeTeam}
          activeTeamId={activeTeamId}
          onChange={handleTeamChange}
          onCreate={handleOpenCreateDialog}
          onSettings={handleOpenSettings}
          settingsDisabled={!activeTeam}
          teams={teams}
        />
      )}
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
    </>
  );
}
