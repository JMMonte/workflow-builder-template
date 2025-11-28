"use client";

import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  api,
  TEAM_STORAGE_KEY,
  type Team,
  type TeamMember,
} from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

function RoleBadge({ teamRole }: { teamRole: TeamMember["role"] }) {
  return (
    <span className="rounded-full border px-2 py-0.5 font-medium text-xs capitalize">
      {teamRole}
    </span>
  );
}

type MemberRowProps = {
  member: TeamMember;
  canManage: boolean;
  currentUserId?: string;
  onRemove: (userId: string) => void;
};

function MemberRow({
  member,
  canManage,
  currentUserId,
  onRemove,
}: MemberRowProps) {
  return (
    <div className="flex items-center justify-between rounded-md bg-muted/20 p-3">
      <div>
        <p className="font-medium text-sm">
          {member.name || member.email || "Member"}
        </p>
        <p className="text-muted-foreground text-xs">{member.email}</p>
      </div>
      <div className="flex items-center gap-2">
        <RoleBadge teamRole={member.role} />
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
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Team management coordinates multiple handlers and data fetches
export default function TeamManagementPage() {
  const { data: session, isPending } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [renameDraft, setRenameDraft] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const activeTeam = teams.find((team) => team.id === activeTeamId) || null;
  const canManageTeam = activeTeam?.role === "owner";
  let displayRole: TeamMember["role"] | null = null;
  if (canManageTeam) {
    displayRole = "owner";
  } else if (activeTeam) {
    displayRole = activeTeam.role;
  }

  const loadMembers = useCallback(async (teamId: string) => {
    try {
      setLoadingMembers(true);
      const data = await api.team.members(teamId);
      setMembers(data);
    } catch (error) {
      console.error("Failed to load team members:", error);
      toast.error("Failed to load team members");
    } finally {
      setLoadingMembers(false);
    }
  }, []);

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
        setLoadingTeams(true);
        const data = await api.team.list();
        setTeams(data);

        const nextId = pickActiveTeamId(data, preferredId);
        setActiveTeamId(nextId);

        if (nextId) {
          api.team.setActiveTeam(nextId);
          setRenameDraft(data.find((team) => team.id === nextId)?.name || "");
          await loadMembers(nextId);
        } else {
          setMembers([]);
        }
      } catch (error) {
        console.error("Failed to load teams:", error);
        toast.error("Failed to load teams");
      } finally {
        setLoadingTeams(false);
      }
    },
    [loadMembers, pickActiveTeamId]
  );

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!session?.user) {
      setLoadingTeams(false);
      return;
    }

    loadTeams();
  }, [isPending, loadTeams, session?.user]);

  const handleTeamChange = async (teamId: string) => {
    setActiveTeamId(teamId);
    api.team.setActiveTeam(teamId);
    setRenameDraft(teams.find((team) => team.id === teamId)?.name || "");
    await loadMembers(teamId);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error("Enter a team name");
      return;
    }

    try {
      setCreatingTeam(true);
      const created = await api.team.create(newTeamName.trim());
      await loadTeams(created.id);
      setNewTeamName("");
      toast.success("Team created");
    } catch (error) {
      console.error("Failed to create team:", error);
      toast.error("Failed to create team");
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleRenameTeam = async () => {
    if (!(activeTeamId && renameDraft.trim())) {
      return;
    }

    try {
      setRenaming(true);
      await api.team.update(activeTeamId, renameDraft.trim());
      await loadTeams(activeTeamId);
      toast.success("Team name updated");
    } catch (error) {
      console.error("Failed to rename team:", error);
      toast.error("Failed to rename team");
    } finally {
      setRenaming(false);
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
      await loadMembers(activeTeamId);
      toast.success("Member invited");
      setInviteEmail("");
    } catch (error) {
      console.error("Failed to invite member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to invite member"
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
      toast.success("Member removed");
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast.error("Failed to remove member");
    }
  };

  const handleDeleteTeam = async () => {
    if (!activeTeamId) {
      return;
    }

    try {
      setDeleting(true);
      await api.team.delete(activeTeamId);
      setDeleteDialogOpen(false);
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

  let membersContent: ReactNode = null;
  if (loadingMembers) {
    membersContent = (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    );
  } else if (members.length === 0) {
    membersContent = (
      <div className="rounded-md bg-muted/20 p-6 text-center">
        <p className="font-medium text-sm">No members yet</p>
        <p className="text-muted-foreground text-xs">
          Invite teammates to collaborate on workflows.
        </p>
      </div>
    );
  } else {
    membersContent = (
      <div className="space-y-2">
        {members.map((member) => (
          <MemberRow
            canManage={canManageTeam}
            currentUserId={session?.user?.id}
            key={member.id}
            member={member}
            onRemove={handleRemoveMember}
          />
        ))}
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Teams</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Manage team membership and access control
          </p>
        </div>
        <Button
          disabled={loadingTeams || isPending}
          onClick={() => loadTeams(activeTeamId)}
          size="sm"
          variant="ghost"
        >
          <RefreshCw
            className={cn("size-4", loadingTeams ? "animate-spin" : undefined)}
          />
        </Button>
      </div>

      <div className="space-y-8">
        <section className="space-y-3">
          <div>
            <Label className="text-base">Current team</Label>
            <p className="text-muted-foreground text-xs">
              All workflows and integrations belong to this team
            </p>
          </div>
          <Select
            disabled={loadingTeams || teams.length === 0}
            onValueChange={handleTeamChange}
            value={activeTeamId || ""}
          >
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="No teams available" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  <div className="flex items-center justify-between gap-4">
                    <span>{team.name}</span>
                    <span className="text-muted-foreground text-xs capitalize">
                      {team.role}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {activeTeam ? (
          <>
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-medium text-sm">Team members</h2>
                  <p className="text-muted-foreground text-xs">
                    {activeTeam.name}
                  </p>
                </div>
                {displayRole ? <RoleBadge teamRole={displayRole} /> : null}
              </div>

              {membersContent}

              {canManageTeam ? (
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-sm">Invite member</Label>
                  <div className="flex gap-2">
                    <Input
                      className="max-w-xs"
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@example.com"
                      value={inviteEmail}
                    />
                    <Button
                      disabled={
                        inviting || !inviteEmail.trim() || !activeTeamId
                      }
                      onClick={handleInvite}
                      size="sm"
                    >
                      {inviting ? <Spinner className="mr-2 size-4" /> : null}
                      Invite
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>

            {canManageTeam ? (
              <section className="space-y-3">
                <div>
                  <Label className="text-sm">Team settings</Label>
                  <p className="text-muted-foreground text-xs">
                    Rename or delete this team
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      className="max-w-xs"
                      onChange={(e) => setRenameDraft(e.target.value)}
                      placeholder="Team name"
                      value={renameDraft}
                    />
                    <Button
                      disabled={
                        renaming ||
                        !renameDraft.trim() ||
                        renameDraft.trim() === activeTeam?.name
                      }
                      onClick={handleRenameTeam}
                      size="sm"
                      variant="outline"
                    >
                      {renaming ? <Spinner className="mr-2 size-4" /> : null}
                      Rename
                    </Button>
                  </div>
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        <section className="space-y-3 border-t pt-6">
          <div>
            <Label className="text-sm">Create team</Label>
            <p className="text-muted-foreground text-xs">
              Start a new team for your workflows
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              className="max-w-xs"
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team name"
              value={newTeamName}
            />
            <Button
              disabled={creatingTeam || !newTeamName.trim()}
              onClick={handleCreateTeam}
              size="sm"
            >
              {creatingTeam ? (
                <Spinner className="mr-2 size-4" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              Create
            </Button>
          </div>
        </section>

        {canManageTeam && activeTeam ? (
          <section className="space-y-3 border-destructive/20 border-t pt-6">
            <div>
              <Label className="text-sm">Danger zone</Label>
              <p className="text-muted-foreground text-xs">
                Permanently delete this team
              </p>
            </div>
            <Button
              disabled={!activeTeamId}
              onClick={() => setDeleteDialogOpen(true)}
              size="sm"
              variant="destructive"
            >
              {deleting ? (
                <Spinner className="mr-2 size-4" />
              ) : (
                <Trash2 className="mr-2 size-4" />
              )}
              Delete team
            </Button>
          </section>
        ) : null}
      </div>

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
              onClick={handleDeleteTeam}
            >
              {deleting ? <Spinner className="mr-2 size-4" /> : null}
              Delete team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
