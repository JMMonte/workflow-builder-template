import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getTeamMembership,
  listTeamMembers,
  removeTeamMember,
} from "@/lib/db/teams";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ teamId: string; userId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, userId } = await context.params;
    const membership = await getTeamMembership(teamId, session.user.id);

    if (!membership) {
      return NextResponse.json(
        { error: "You do not have access to this team" },
        { status: 403 }
      );
    }

    const members = await listTeamMembers(teamId);
    const targetMember = members.find((member) => member.userId === userId);

    if (!targetMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    const isOwner = membership.membership.role === "owner";
    const isSelf = userId === session.user.id;

    if (!(isOwner || isSelf)) {
      return NextResponse.json(
        { error: "Only owners can remove other members" },
        { status: 403 }
      );
    }

    if (targetMember.role === "owner") {
      const ownerCount = members.filter(
        (member) => member.role === "owner"
      ).length;

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "At least one owner is required for a team" },
          { status: 400 }
        );
      }
    }

    await removeTeamMember(teamId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove team member:", error);
    return NextResponse.json(
      {
        error: "Failed to remove team member",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
