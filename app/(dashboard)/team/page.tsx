"use client";

import { MoreHorizontal, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GridTable,
  type GridTableColumn,
  GridTableRow,
} from "@/components/ui/grid-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  api,
  TEAM_STORAGE_KEY,
  type Team,
  type TeamMember,
  type TeamMemberOrInvite,
} from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

function RoleBadge({ teamRole }: { teamRole: TeamMember["role"] }) {
  return (
    <span className="rounded-md border bg-muted/30 px-2 py-1 font-medium text-xs capitalize">
      {teamRole}
    </span>
  );
}

const MEMBER_GRID_TEMPLATE =
  "grid-cols-[minmax(150px,1fr)_minmax(220px,2fr)_minmax(140px,0.8fr)_100px]";

const MEMBER_COLUMNS: GridTableColumn[] = [
  { id: "name", label: "Name" },
  { id: "email", label: "Email" },
  { id: "role", label: "Role" },
  { id: "actions", label: "Actions", align: "right" },
];

type MemberRowProps = {
  entry: TeamMemberOrInvite;
  canManage: boolean;
  currentUserId?: string;
  onRemove: (userId: string) => void;
  onReinvite: (email: string) => void;
  reinvitingEmail?: string | null;
};

function MemberRow({
  entry,
  canManage,
  currentUserId,
  onRemove,
  onReinvite,
  reinvitingEmail,
}: MemberRowProps) {
  if (entry.type === "invite") {
    const isExpired = entry.status === "expired";
    const statusLabel = isExpired ? "Invitation expired" : "Invitation sent";

    return (
      <GridTableRow className="items-center" template={MEMBER_GRID_TEMPLATE}>
        <div className="truncate">
          <p className="truncate font-medium text-sm">Pending invite</p>
        </div>
        <div className="truncate">
          <p className="truncate text-muted-foreground text-sm">
            {entry.email}
          </p>
        </div>
        <div className="flex">
          <span
            className={cn(
              "inline-flex min-w-[130px] justify-center rounded-md border px-2 py-1 text-xs",
              isExpired
                ? "border-destructive/40 text-destructive"
                : "border-primary/40 text-primary"
            )}
          >
            {statusLabel}
          </span>
        </div>
        <div className="flex justify-end">
          {canManage ? (
            <Button
              disabled={reinvitingEmail === entry.email}
              onClick={() => onReinvite(entry.email)}
              size="sm"
              variant="outline"
            >
              {reinvitingEmail === entry.email ? (
                <Spinner className="mr-2 size-4" />
              ) : null}
              Reinvite
            </Button>
          ) : null}
        </div>
      </GridTableRow>
    );
  }

  const member = entry;

  return (
    <GridTableRow className="items-center" template={MEMBER_GRID_TEMPLATE}>
      <div className="truncate">
        <p className="truncate font-medium text-sm">{member.name || "—"}</p>
      </div>
      <div className="truncate">
        <p className="truncate text-muted-foreground text-sm">{member.email}</p>
      </div>
      <div>
        <RoleBadge teamRole={member.role} />
      </div>
      <div className="flex justify-end">
        {canManage && member.userId !== currentUserId ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => onRemove(member.userId)}
              >
                <Trash2 className="mr-2 size-4" />
                Remove member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </GridTableRow>
  );
}

export default function TeamManagementPage() {
  const { data: session, isPending } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMemberOrInvite[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [reinvitingEmail, setReinvitingEmail] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const currentUserId = session?.user?.id ?? null;
  const hasLoadedInitialData = useRef(false);
  const lastHandledTeamId = useRef<string | null>(null);
  const syncingTeamChange = useRef(false);

  const activeTeam = teams.find((team) => team.id === activeTeamId) || null;
  const canManageTeam = activeTeam?.role === "owner";

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
        hasLoadedInitialData.current = true;
        syncingTeamChange.current = true;
        setLoadingTeams(true);
        const data = await api.team.list();
        setTeams(data);

        const nextId = pickActiveTeamId(data, preferredId);
        setActiveTeamId(nextId);

        if (nextId) {
          lastHandledTeamId.current = nextId;
          api.team.setActiveTeam(nextId);
          await loadMembers(nextId);
        } else {
          lastHandledTeamId.current = null;
          setMembers([]);
        }
      } catch (error) {
        console.error("Failed to load teams:", error);
        toast.error("Failed to load teams");
      } finally {
        syncingTeamChange.current = false;
        setLoadingTeams(false);
      }
    },
    [loadMembers, pickActiveTeamId]
  );

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!currentUserId) {
      setLoadingTeams(false);
      return;
    }

    if (hasLoadedInitialData.current) {
      return;
    }

    loadTeams();
  }, [currentUserId, isPending, loadTeams]);

  useEffect(() => {
    const getTeamIdFromEvent = (incomingEvent: Event): string | null => {
      if (incomingEvent instanceof CustomEvent) {
        return (
          (incomingEvent as CustomEvent<{ teamId?: string }>).detail?.teamId ||
          null
        );
      }

      if (
        incomingEvent instanceof StorageEvent &&
        incomingEvent.key === TEAM_STORAGE_KEY
      ) {
        return incomingEvent.newValue;
      }

      return null;
    };

    const handleExternalTeamChange = (event: Event) => {
      if (syncingTeamChange.current) {
        return;
      }

      const detailTeamId = getTeamIdFromEvent(event);
      const storedTeamId =
        typeof window !== "undefined"
          ? window.localStorage.getItem(TEAM_STORAGE_KEY)
          : null;

      const nextTeamId = detailTeamId || storedTeamId;

      if (!nextTeamId || nextTeamId === activeTeamId) {
        return;
      }

      if (nextTeamId === lastHandledTeamId.current) {
        return;
      }

      lastHandledTeamId.current = nextTeamId;
      loadTeams(nextTeamId);
    };

    window.addEventListener("active-team-change", handleExternalTeamChange);
    window.addEventListener("storage", handleExternalTeamChange);

    return () => {
      window.removeEventListener(
        "active-team-change",
        handleExternalTeamChange
      );
      window.removeEventListener("storage", handleExternalTeamChange);
    };
  }, [activeTeamId, loadTeams]);

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
      const result = await api.team.addMember(activeTeamId, inviteEmail.trim());
      await loadMembers(activeTeamId);
      toast.success(
        result.status === "invited" ? "Invite email sent" : "Member invited"
      );
      setInviteEmail("");
      setInviteDialogOpen(false);
    } catch (error) {
      console.error("Failed to invite member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to invite member"
      );
    } finally {
      setInviting(false);
    }
  };

  const handleReinvite = async (email: string) => {
    if (!activeTeamId) {
      toast.error("Select a team first");
      return;
    }

    try {
      setReinvitingEmail(email);
      const result = await api.team.addMember(activeTeamId, email);
      await loadMembers(activeTeamId);
      toast.success(
        result.status === "invited" ? "Invite email sent" : "Member invited"
      );
    } catch (error) {
      console.error("Failed to resend invite:", error);
      toast.error("Failed to resend invite");
    } finally {
      setReinvitingEmail(null);
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

  let membersContent: ReactNode = null;
  if (loadingMembers) {
    const skeletonRows = Array.from(
      { length: 5 },
      (_, index) => `member-${index}`
    );

    membersContent = (
      <GridTable
        columns={[
          { id: "name", label: <Skeleton className="h-4 w-16" /> },
          { id: "email", label: <Skeleton className="h-4 w-28" /> },
          { id: "role", label: <Skeleton className="h-4 w-12" /> },
          {
            id: "actions",
            label: (
              <div className="flex justify-end">
                <Skeleton className="h-4 w-10" />
              </div>
            ),
            align: "right",
          },
        ]}
        template={MEMBER_GRID_TEMPLATE}
      >
        {skeletonRows.map((key) => (
          <GridTableRow
            className="items-center"
            key={key}
            template={MEMBER_GRID_TEMPLATE}
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-6 w-20 rounded-md" />
            <div className="flex justify-end">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </GridTableRow>
        ))}
      </GridTable>
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
      <GridTable columns={MEMBER_COLUMNS} template={MEMBER_GRID_TEMPLATE}>
        {members.map((member) => (
          <MemberRow
            canManage={canManageTeam}
            currentUserId={session?.user?.id}
            entry={member}
            key={member.id}
            onReinvite={handleReinvite}
            onRemove={handleRemoveMember}
            reinvitingEmail={reinvitingEmail}
          />
        ))}
      </GridTable>
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl">Members</h1>
          <p className="text-muted-foreground text-sm">
            Manage workspace members and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={loadingTeams || isPending}
            onClick={() => loadTeams(activeTeamId)}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={cn(
                "size-4",
                loadingTeams ? "animate-spin" : undefined
              )}
            />
            Refresh
          </Button>
          {canManageTeam && activeTeam ? (
            <Button
              onClick={() => {
                setInviteEmail("");
                setInviteDialogOpen(true);
              }}
              size="sm"
            >
              <Plus className="mr-2 size-4" />
              Invite
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">{membersContent}</div>

      <Dialog onOpenChange={setInviteDialogOpen} open={inviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
            <DialogDescription>
              Invite a teammate to {activeTeam?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@example.com"
                type="email"
                value={inviteEmail}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={inviting || !inviteEmail.trim() || !activeTeamId}
              onClick={handleInvite}
            >
              {inviting ? <Spinner className="mr-2 size-4" /> : null}
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
