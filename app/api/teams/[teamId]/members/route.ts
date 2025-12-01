import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  isInviteExpired,
  listInvitesForTeam,
  type TeamInvite,
  upsertTeamInvite,
} from "@/lib/db/team-invites";
import {
  getTeamMembership,
  listTeamMembers,
} from "@/lib/db/teams";
import {
  isSystemMailerConfigured,
  sendTeamInviteEmail,
} from "@/lib/email/system-mailer";

type ValidSession = NonNullable<
  Awaited<ReturnType<(typeof auth.api)["getSession"]>>
>;
type ValidMembership = NonNullable<
  Awaited<ReturnType<typeof getTeamMembership>>
>;

type AddMemberValidation =
  | {
      ok: true;
      session: ValidSession;
      membership: ValidMembership;
      teamId: string;
      email: string;
    }
  | { ok: false; response: NextResponse };

async function validateAddMemberRequest(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
): Promise<AddMemberValidation> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { teamId } = await context.params;
  const membership = await getTeamMembership(teamId, session.user.id);

  if (!membership) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You do not have access to this team" },
        { status: 403 }
      ),
    };
  }

  if (membership.membership.role !== "owner") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Only team owners can add members" },
        { status: 403 }
      ),
    };
  }

  const body = await request.json().catch(() => ({}));
  const email =
    typeof body.email === "string" && body.email.includes("@")
      ? body.email.trim()
      : null;

  if (!email) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 }
      ),
    };
  }

  return {
    ok: true,
    session,
    membership,
    teamId,
    email,
  };
}

async function sendInviteIfConfigured(input: {
  memberEmail?: string | null;
  teamName: string;
  inviterName: string;
  inviteId?: string;
}) {
  if (!input.memberEmail) {
    return;
  }

  if (!isSystemMailerConfigured()) {
    console.warn(
      "[Team Invite] System Resend is not configured; skipping invite email"
    );
    return;
  }

  const result = await sendTeamInviteEmail({
    to: input.memberEmail,
    teamName: input.teamName,
    inviterName: input.inviterName,
    inviteId: input.inviteId,
  });

  if (!result.success) {
    console.error("Failed to send team invite email:", result.error);
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await context.params;
    const membership = await getTeamMembership(teamId, session.user.id);

    if (!membership) {
      return NextResponse.json(
        { error: "You do not have access to this team" },
        { status: 403 }
      );
    }

    const members = await listTeamMembers(teamId);
    const invites = await listInvitesForTeam(teamId);

    const memberRows = members.map((member) => ({
      type: "member" as const,
      id: member.id,
      teamId: member.teamId,
      userId: member.userId,
      role: member.role,
      name: member.user.name,
      email: member.user.email,
      createdAt: member.createdAt.toISOString(),
    }));

    const memberEmails = new Set(
      memberRows
        .map((member) => member.email?.toLowerCase())
        .filter((email): email is string => Boolean(email))
    );

    const inviteRows = invites.map((invite) => {
      const expired =
        invite.status === "pending" ? isInviteExpired(invite) : false;
      const status = expired ? "expired" : invite.status;
      return {
        type: "invite" as const,
        id: invite.id,
        teamId: invite.teamId,
        email: invite.email,
        status,
        invitedBy: invite.invitedBy,
        acceptedUserId: invite.acceptedUserId,
        createdAt: invite.createdAt.toISOString(),
        updatedAt: invite.updatedAt.toISOString(),
        expiresAt: invite.expiresAt?.toISOString(),
      };
    });

    const filteredInvites = inviteRows.filter((invite) => {
      const normalizedEmail = invite.email.toLowerCase();
      const alreadyMember = memberEmails.has(normalizedEmail);

      // Only show pending or expired invites, hide accepted/cancelled ones
      const shouldShow = invite.status === "pending" || invite.status === "expired";

      return !alreadyMember && shouldShow;
    });

    return NextResponse.json([...memberRows, ...filteredInvites]);
  } catch (error) {
    console.error("Failed to list team members:", error);
    return NextResponse.json(
      {
        error: "Failed to list team members",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const validation = await validateAddMemberRequest(request, context);
    if (!validation.ok) {
      return validation.response;
    }

    const { membership, session, teamId, email } = validation;

    // Always create an invite - users need to accept it
    const invite: TeamInvite = await upsertTeamInvite({
      teamId,
      email,
      invitedBy: session.user.id,
    });

    await sendInviteIfConfigured({
      memberEmail: invite.email,
      teamName: membership.team.name,
      inviterName: session.user.name || session.user.email || "A teammate",
      inviteId: invite.id,
    });

    return NextResponse.json({
      status: "invited",
      invite: {
        id: invite.id,
        teamId: invite.teamId,
        email: invite.email,
        status: invite.status,
        invitedBy: invite.invitedBy,
        acceptedUserId: invite.acceptedUserId,
        createdAt: invite.createdAt.toISOString(),
        updatedAt: invite.updatedAt.toISOString(),
        expiresAt: invite.expiresAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to add team member:", error);
    const message =
      error instanceof Error ? error.message : "Failed to add team member";
    return NextResponse.json(
      {
        error: message,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: message === "User not found" ? 404 : 500 }
    );
  }
}
