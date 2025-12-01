"use client";

import { Check, LogIn, LogOut, Mail, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthDialog } from "@/components/auth/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  ApiError,
  api,
  type InviteDetails,
  TEAM_STORAGE_KEY,
  teamApi,
} from "@/lib/api-client";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function InvitePage({
  params,
}: {
  params: Promise<{ inviteId: string }>;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const { inviteId } = use(params);

  useEffect(() => {
    const loadInvite = async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await api.invite.get(inviteId);
        setInvite(data);
      } catch (err) {
        console.error("Failed to load invite", err);
        const message =
          err instanceof ApiError ? err.message : "Failed to load invite";
        setError(message);
        setInvite(null);
      } finally {
        setLoading(false);
      }
    };

    loadInvite();
  }, [inviteId]);

  useEffect(() => {
    if (!invite) {
      return;
    }

    setAuthEmail(invite.email);
    setSelectedAccount(invite.email);
  }, [invite]);

  useEffect(() => {
    if (!invite || isPending) {
      return;
    }

    if (!session?.user) {
      setAuthMode("signin");
      setAuthDialogOpen(true);
    }
  }, [invite, isPending, session?.user]);

  const acceptInvite = useCallback(
    async (inviteToAccept: InviteDetails) => {
      try {
        setError(null);
        setAccepting(true);
        const body = await api.invite.accept(inviteToAccept.id);
        teamApi.setActiveTeam(body.teamId);
        const message =
          body.status === "already-member"
            ? `You're already a member of ${body.teamName}`
            : `Joined ${body.teamName}`;
        toast.success(message);
        router.push("/");
      } catch (err) {
        console.error("Failed to accept invite", err);
        const message =
          err instanceof ApiError ? err.message : "Failed to accept invite";
        setError(message);
        toast.error(message);
      } finally {
        setAccepting(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!(invite && session?.user?.email) || accepting) {
      return;
    }

    if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return;
    }

    if (invite.status !== "pending") {
      return;
    }

    acceptInvite(invite);
  }, [acceptInvite, accepting, invite, session?.user?.email]);

  const handleSwitchAccount = async (targetEmail?: string) => {
    try {
      setSwitchingAccount(true);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(TEAM_STORAGE_KEY);
      }
      await signOut();
      if (targetEmail) {
        setAuthEmail(targetEmail);
      }
      setAuthMode("signup");
      setAuthDialogOpen(true);
    } catch (err) {
      console.error("Failed to switch accounts", err);
      toast.error("Failed to switch accounts");
    } finally {
      setSwitchingAccount(false);
    }
  };

  const handleAccountContinue = async () => {
    if (!(invite && selectedAccount)) {
      toast.error("Select an account to continue.");
      return;
    }

    if (selectedAccount.toLowerCase() !== invite.email.toLowerCase()) {
      toast.error("Switch to the invited account to continue.");
      return;
    }

    await handleSwitchAccount(invite.email);
  };

  const showMismatch =
    invite &&
    session?.user?.email &&
    invite.email.toLowerCase() !== session.user.email.toLowerCase() &&
    invite.status === "pending";

  const errorMessage =
    error && invite?.status === "pending" ? (
      <p className="text-destructive text-sm">{error}</p>
    ) : null;

  const renderUnauthenticated = () => (
    <div className="space-y-4 text-sm">
      <p className="text-base">
        This invite is for <strong>{invite?.email}</strong>. Sign in or create
        an account to join <strong>{invite?.teamName}</strong>.
      </p>
      <div className="rounded-md border bg-muted/50 px-3 py-2 font-medium text-muted-foreground text-xs">
        Invited account: {invite?.email}
      </div>
      {errorMessage}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={() => {
            setAuthMode("signin");
            setAuthDialogOpen(true);
          }}
          variant="default"
        >
          <LogIn className="mr-2 size-4" />
          Sign In
        </Button>
        <Button
          onClick={() => {
            setAuthMode("signup");
            setAuthDialogOpen(true);
          }}
          variant="outline"
        >
          <UserPlus className="mr-2 size-4" />
          Create Account
        </Button>
      </div>
    </div>
  );

  const renderMismatch = () => (
    <div className="space-y-4">
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/20">
        <p className="text-sm">
          This invite is for <strong>{invite?.email}</strong>, but you are
          currently signed in as <strong>{session?.user?.email}</strong>.
        </p>
      </div>

      <div className="space-y-2.5">
        <p className="font-medium text-sm">Choose an account to continue:</p>

        {invite?.email ? (
          <button
            type="button"
            onClick={() => setSelectedAccount(invite.email)}
            className={cn(
              "w-full rounded-lg border-2 p-3.5 text-left transition-all",
              selectedAccount === invite.email
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <p className="font-medium text-sm">{invite.email}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-600" />
                  <p className="text-emerald-600 text-xs">
                    Invited to {invite.teamName}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "mt-0.5 size-5 rounded-full border-2 transition-all",
                  selectedAccount === invite.email
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {selectedAccount === invite.email ? (
                  <Check className="size-4 text-primary-foreground" />
                ) : null}
              </div>
            </div>
          </button>
        ) : null}

        {session?.user?.email && session.user.email !== invite?.email ? (
          <button
            type="button"
            onClick={() => setSelectedAccount(session.user.email)}
            className={cn(
              "w-full rounded-lg border-2 p-3.5 text-left opacity-60 transition-all",
              selectedAccount === session.user.email
                ? "border-muted-foreground bg-muted/30"
                : "border-border bg-card hover:border-muted-foreground/50"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <UserPlus className="size-4 text-muted-foreground" />
                  <p className="font-medium text-sm">{session.user.email}</p>
                </div>
                <p className="text-muted-foreground text-xs">
                  Currently signed in
                </p>
                <p className="text-destructive text-xs">
                  Cannot accept invite for different email
                </p>
              </div>
              <div
                className={cn(
                  "mt-0.5 size-5 rounded-full border-2 transition-all",
                  selectedAccount === session.user.email
                    ? "border-muted-foreground bg-muted-foreground"
                    : "border-muted-foreground/30"
                )}
              >
                {selectedAccount === session.user.email ? (
                  <Check className="size-4 text-background" />
                ) : null}
              </div>
            </div>
          </button>
        ) : null}
      </div>

      {errorMessage}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          disabled={
            switchingAccount ||
            !selectedAccount ||
            selectedAccount !== invite?.email
          }
          onClick={handleAccountContinue}
          className="w-full sm:w-auto"
        >
          {switchingAccount ? (
            <>
              <Spinner className="mr-2 size-4" />
              Switching accounts…
            </>
          ) : (
            <>
              <LogOut className="mr-2 size-4" />
              Sign in as {invite?.email}
            </>
          )}
        </Button>
      </div>

      {selectedAccount === session?.user?.email ? (
        <p className="rounded-md bg-muted px-3 py-2 text-muted-foreground text-xs">
          You must sign in with the invited email address ({invite?.email}) to
          accept this invitation.
        </p>
      ) : null}
    </div>
  );

  const renderAccepting = () => (
    <div className="space-y-2">
      <p>
        You have been invited to join{" "}
        <strong className="font-semibold">{invite?.teamName}</strong>.
      </p>
      <p className="text-muted-foreground text-sm">
        Accepting as <strong>{session?.user?.email}</strong>
      </p>
      {errorMessage}
      <Button
        className={cn("mt-2")}
        disabled={accepting}
        onClick={() => invite && acceptInvite(invite)}
      >
        {accepting ? (
          <>
            <Spinner className="mr-2 size-4" />
            Joining…
          </>
        ) : (
          <>
            <UserPlus className="mr-2 size-4" />
            Accept invite
          </>
        )}
      </Button>
    </div>
  );

  const renderPendingInvite = () => {
    if (!(session?.user || isPending)) {
      return renderUnauthenticated();
    }

    if (showMismatch) {
      return renderMismatch();
    }

    return renderAccepting();
  };

  const renderBody = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Spinner className="size-4" />
          <span>Loading invite…</span>
        </div>
      );
    }

    if (!invite) {
      return <p className="text-destructive">{error || "Invite not found"}</p>;
    }

    if (invite.status === "expired") {
      return (
        <p className="text-muted-foreground">
          This invite has expired. Ask your admin to send a new one.
        </p>
      );
    }

    if (invite.status === "cancelled") {
      return (
        <p className="text-muted-foreground">This invite was cancelled.</p>
      );
    }

    if (invite.status === "accepted") {
      return (
        <div className="flex items-center gap-2 text-emerald-600">
          <Check className="size-4" />
          <span>Invite already accepted.</span>
        </div>
      );
    }

    return renderPendingInvite();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="size-4" />
            Team Invitation
          </CardTitle>
        </CardHeader>
        <CardContent>{renderBody()}</CardContent>
      </Card>
      <AuthDialog
        defaultMode="signin"
        forceOpen={authDialogOpen}
        initialEmail={authEmail}
        initialMode={authMode}
        onOpenChange={setAuthDialogOpen}
      />
    </div>
  );
}
