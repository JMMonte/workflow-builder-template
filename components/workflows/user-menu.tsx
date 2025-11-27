"use client";

import { LogOut, Moon, Plug, Plus, Settings, Sun, Users } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AuthDialog,
  isSingleProviderSignInInitiated,
} from "@/components/auth/dialog";
import { SettingsDialog } from "@/components/settings";
import { IntegrationsDialog } from "@/components/settings/integrations-dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  api,
  TEAM_STORAGE_KEY,
  type Team,
  type TeamMember,
} from "@/lib/api-client";
import { signOut, useSession } from "@/lib/auth-client";

type TeamMenuItemsProps = {
  loading: boolean;
  teams: Team[];
  activeTeamId: string | null;
  onChange: (teamId: string) => void;
  onCreateTeam: () => void;
  onManageMembers: () => void;
};

function TeamMenuItems({
  loading,
  teams,
  activeTeamId,
  onChange,
  onCreateTeam,
  onManageMembers,
}: TeamMenuItemsProps) {
  if (loading) {
    return <DropdownMenuItem disabled>Loading teams...</DropdownMenuItem>;
  }

  if (teams.length === 0) {
    return (
      <>
        <DropdownMenuItem disabled>No teams yet</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateTeam}>
          <Plus className="size-4" />
          <span>Create team</span>
        </DropdownMenuItem>
      </>
    );
  }

  return (
    <>
      <DropdownMenuRadioGroup
        onValueChange={onChange}
        value={activeTeamId || ""}
      >
        {teams.map((team) => (
          <DropdownMenuRadioItem key={team.id} value={team.id}>
            <div className="flex flex-col">
              <span>{team.name}</span>
              <span className="text-muted-foreground text-xs">
                {team.role === "owner" ? "Owner" : "Member"}
              </span>
            </div>
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onCreateTeam}>
        <Plus className="size-4" />
        <span>Create team</span>
      </DropdownMenuItem>
      <DropdownMenuItem disabled={!activeTeamId} onClick={onManageMembers}>
        <Users className="size-4" />
        <span>Manage team</span>
      </DropdownMenuItem>
    </>
  );
}

type TeamMembersListProps = {
  loading: boolean;
  members: TeamMember[];
  canManage: boolean;
  currentUserId?: string;
  onRemove: (userId: string) => void;
};

function TeamMembersList({
  loading,
  members,
  canManage,
  currentUserId,
  onRemove,
}: TeamMembersListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Spinner />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No team members yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          className="flex items-center justify-between rounded-md border p-3"
          key={member.id}
        >
          <div>
            <p className="font-medium text-sm">
              {member.name || member.email || "Member"}
            </p>
            <p className="text-muted-foreground text-xs">{member.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border px-2 py-0.5 text-xs">
              {member.role === "owner" ? "Owner" : "Member"}
            </span>
            {canManage && member.userId !== currentUserId ? (
              <Button
                onClick={() => onRemove(member.userId)}
                size="sm"
                variant="ghost"
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function pickNextTeamId(
  teamsList: Team[],
  currentId: string | null,
  storedId: string | null
): string | null {
  if (storedId && teamsList.some((team) => team.id === storedId)) {
    return storedId;
  }
  if (currentId && teamsList.some((team) => team.id === currentId)) {
    return currentId;
  }
  return teamsList[0]?.id || null;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Menu orchestration requires several handlers
export const UserMenu = () => {
  const { data: session, isPending } = useSession();
  const { theme, setTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [teamNameDraft, setTeamNameDraft] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const activeTeam = activeTeamId
    ? teams.find((team) => team.id === activeTeamId) || null
    : null;
  const canManageTeam = activeTeam?.role === "owner";

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TEAM_STORAGE_KEY);
    }
    await signOut();
  };

  const setActiveTeamSelection = useCallback(
    (teamId: string | null, teamName?: string) => {
      setActiveTeamId(teamId);
      if (teamId) {
        api.team.setActiveTeam(teamId);
        if (teamName) {
          setTeamNameDraft(teamName);
        }
      } else if (typeof window !== "undefined") {
        window.localStorage.removeItem(TEAM_STORAGE_KEY);
      }
    },
    []
  );

  const loadTeams = useCallback(async () => {
    if (!session?.user) {
      return [];
    }

    try {
      setLoadingTeams(true);
      const data = await api.team.list();
      setTeams(data);
      const storedTeamId =
        typeof window !== "undefined"
          ? window.localStorage.getItem(TEAM_STORAGE_KEY)
          : null;

      const nextTeamId = pickNextTeamId(data, activeTeamId, storedTeamId);
      setActiveTeamSelection(
        nextTeamId,
        data.find((team) => team.id === nextTeamId)?.name
      );

      return data;
    } catch (error) {
      console.error("Failed to load teams:", error);
      toast.error("Failed to load teams");
      return [];
    } finally {
      setLoadingTeams(false);
    }
  }, [activeTeamId, session?.user, setActiveTeamSelection]);

  const loadMembers = useCallback(async (teamId: string) => {
    try {
      setLoadingMembers(true);
      const members = await api.team.members(teamId);
      setTeamMembers(members);
    } catch (error) {
      console.error("Failed to load team members:", error);
      toast.error("Failed to load team members");
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  const handleTeamChange = (teamId: string) => {
    setActiveTeamId(teamId);
    api.team.setActiveTeam(teamId);

    if (teamDialogOpen) {
      loadMembers(teamId);
    }
  };

  const handleCreateTeam = async () => {
    try {
      setCreatingTeam(true);
      const created = await api.team.create(newTeamName.trim() || "New Team");
      api.team.setActiveTeam(created.id);
      setActiveTeamId(created.id);
      setCreateTeamOpen(false);
      setNewTeamName("");
      await loadTeams();
      setTeamNameDraft(created.name);
    } catch (error) {
      console.error("Failed to create team:", error);
      toast.error("Failed to create team");
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleInvite = async () => {
    if (!activeTeamId) {
      toast.error("Select a team first");
      return;
    }

    if (!inviteEmail.trim()) {
      toast.error("Enter an email address");
      return;
    }

    try {
      setInviting(true);
      await api.team.addMember(activeTeamId, inviteEmail.trim());
      setInviteEmail("");
      await loadMembers(activeTeamId);
      await loadTeams();
      toast.success("Member added to the team");
    } catch (error) {
      console.error("Failed to add member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add member"
      );
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeTeamId) {
      return;
    }

    try {
      await api.team.removeMember(activeTeamId, userId);
      await loadMembers(activeTeamId);
      await loadTeams();
      toast.success("Member removed");
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast.error("Failed to remove member");
    }
  };

  const openTeamDialog = async () => {
    if (!activeTeamId) {
      return;
    }
    await loadMembers(activeTeamId);
    setTeamNameDraft(activeTeam?.name || "");
    setTeamDialogOpen(true);
  };

  const handleDeleteTeam = useCallback(async () => {
    if (!activeTeamId) {
      return;
    }

    try {
      await api.team.delete(activeTeamId);
      toast.success("Team deleted");
      setDeleteConfirmOpen(false);
      const updatedTeams = await loadTeams();

      if (!updatedTeams || updatedTeams.length === 0) {
        const fallback = await api.team.create("Personal Team");
        setActiveTeamSelection(fallback.id, fallback.name);
        await loadTeams();
        return;
      }

      const nextTeam =
        updatedTeams.find((team) => team.id !== activeTeamId) ||
        updatedTeams[0] ||
        null;
      const nextId = nextTeam?.id || null;
      setActiveTeamSelection(nextId, nextTeam?.name);
      setTeamDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete team:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete team"
      );
    }
  }, [activeTeamId, loadTeams, setActiveTeamSelection]);

  // Fetch provider info when session is available
  useEffect(() => {
    if (session?.user && !session.user.name?.startsWith("Anonymous")) {
      api.user
        .get()
        .then((user) => setProviderId(user.providerId))
        .catch(() => setProviderId(null));
    }
  }, [session?.user]);

  useEffect(() => {
    if (session?.user) {
      loadTeams();
    }
  }, [loadTeams, session?.user]);

  // OAuth users can't edit their profile
  const isOAuthUser =
    providerId === "vercel" ||
    providerId === "github" ||
    providerId === "google";

  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (session?.user?.email) {
      return session.user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const signInInProgress = isSingleProviderSignInInitiated();

  // Don't render anything while session is loading to prevent flash
  // BUT if sign-in is in progress, keep showing the AuthDialog with loading state
  if (isPending && !signInInProgress) {
    return (
      <div className="h-9 w-9" /> // Placeholder to maintain layout
    );
  }

  // Check if user is anonymous
  // Better Auth anonymous plugin creates users with name "Anonymous" and temp- email
  const isAnonymous =
    !session?.user ||
    session.user.name === "Anonymous" ||
    session.user.email?.startsWith("temp-");

  // Show Sign In button if user is anonymous or not logged in
  if (isAnonymous) {
    return (
      <div className="flex items-center gap-2">
        <AuthDialog>
          <Button
            className="h-9 disabled:opacity-100 disabled:[&>*]:text-muted-foreground"
            size="sm"
            variant="default"
          >
            Sign In
          </Button>
        </AuthDialog>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="relative h-9 w-9 rounded-full border p-0"
          variant="ghost"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage
              alt={session?.user?.name || ""}
              src={session?.user?.image || ""}
            />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="font-medium text-sm leading-none">
              {session?.user?.name || "User"}
            </p>
            <p className="text-muted-foreground text-xs leading-none">
              {session?.user?.email}
            </p>
            {activeTeam ? (
              <p className="text-muted-foreground text-xs leading-none">
                Team: {activeTeam.name}
              </p>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!isOAuthUser && (
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
            <Settings className="size-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => setIntegrationsOpen(true)}>
          <Plug className="size-4" />
          <span>Integrations</span>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Users className="size-4" />
            <span>Team</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64">
            <TeamMenuItems
              activeTeamId={activeTeamId}
              loading={loadingTeams}
              onChange={handleTeamChange}
              onCreateTeam={() => setCreateTeamOpen(true)}
              onManageMembers={openTeamDialog}
              teams={teams}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="dark:-rotate-90 size-4 rotate-0 scale-100 transition-all dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup onValueChange={setTheme} value={theme}>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="size-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
      <SettingsDialog onOpenChange={setSettingsOpen} open={settingsOpen} />
      <IntegrationsDialog
        onOpenChange={setIntegrationsOpen}
        open={integrationsOpen}
      />
      <Dialog onOpenChange={setCreateTeamOpen} open={createTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create team</DialogTitle>
            <DialogDescription>
              Share workflows and integrations with your teammates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="team-name">Team name</Label>
            <Input
              id="team-name"
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Product Team"
              value={newTeamName}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setCreateTeamOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button disabled={creatingTeam} onClick={handleCreateTeam}>
              {creatingTeam ? <Spinner className="mr-2 size-4" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog onOpenChange={setTeamDialogOpen} open={teamDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Team members</DialogTitle>
            <DialogDescription>
              Manage access for {activeTeam?.name || "your team"}.
            </DialogDescription>
          </DialogHeader>
          {canManageTeam ? (
            <div className="space-y-2">
              <Label htmlFor="teamName">Team name</Label>
              <div className="flex gap-2">
                <Input
                  id="teamName"
                  onChange={(e) => setTeamNameDraft(e.target.value)}
                  placeholder="Team name"
                  value={teamNameDraft}
                />
                <Button
                  disabled={
                    renaming ||
                    !teamNameDraft.trim() ||
                    teamNameDraft.trim() === activeTeam?.name
                  }
                  onClick={async () => {
                    if (!(activeTeamId && teamNameDraft.trim())) {
                      return;
                    }
                    try {
                      setRenaming(true);
                      await api.team.update(activeTeamId, teamNameDraft.trim());
                      await loadTeams();
                      toast.success("Team name updated");
                    } catch (error) {
                      console.error("Failed to rename team:", error);
                      toast.error("Failed to rename team");
                    } finally {
                      setRenaming(false);
                    }
                  }}
                >
                  {renaming ? <Spinner className="mr-2 size-4" /> : null}
                  Save
                </Button>
              </div>
            </div>
          ) : null}
          <TeamMembersList
            canManage={canManageTeam}
            currentUserId={session?.user?.id}
            loading={loadingMembers}
            members={teamMembers}
            onRemove={handleRemoveMember}
          />
          {canManageTeam ? (
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Invite by email</Label>
              <div className="flex gap-2">
                <Input
                  id="inviteEmail"
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  value={inviteEmail}
                />
                <Button
                  disabled={inviting || !inviteEmail.trim() || !activeTeamId}
                  onClick={handleInvite}
                >
                  {inviting ? <Spinner className="mr-2 size-4" /> : null}
                  Invite
                </Button>
              </div>
              <Button
                className="mt-2"
                onClick={() => setDeleteConfirmOpen(true)}
                variant="destructive"
              >
                Delete team
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <AlertDialog onOpenChange={setDeleteConfirmOpen} open={deleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the team and member access. Workflows or
              integrations must be moved or deleted first. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                await handleDeleteTeam();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenu>
  );
};
