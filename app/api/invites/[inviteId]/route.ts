import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  acceptInviteForUser,
  getInviteWithTeam,
  isInviteExpired,
} from "@/lib/db/team-invites";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { inviteId } = await params;
  const invite = await getInviteWithTeam(inviteId);

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  const status =
    invite.status === "pending" && isInviteExpired(invite)
      ? "expired"
      : invite.status;

  return NextResponse.json({
    id: invite.id,
    teamId: invite.teamId,
    teamName: invite.teamName,
    email: invite.email,
    status,
    invitedBy: invite.invitedBy,
    acceptedUserId: invite.acceptedUserId,
    createdAt: invite.createdAt.toISOString(),
    updatedAt: invite.updatedAt.toISOString(),
    expiresAt: invite.expiresAt?.toISOString(),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inviteId } = await params;
  const result = await acceptInviteForUser({
    inviteId,
    userId: session.user.id,
  });

  if (!result.ok) {
    if (result.reason === "expired") {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 410 }
      );
    }

    if (result.reason === "invalid-email") {
      return NextResponse.json(
        {
          error:
            "This invite was sent to a different email. Please sign in with the invited address.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: result.status,
    teamId: result.teamId,
    teamName: result.teamName,
    email: result.email,
  });
}
