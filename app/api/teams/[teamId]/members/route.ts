import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  addTeamMemberByEmail,
  getTeamMembership,
  listTeamMembers,
} from "@/lib/db/teams";

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

    return NextResponse.json(
      members.map((member) => ({
        id: member.id,
        teamId: member.teamId,
        userId: member.userId,
        role: member.role,
        name: member.user.name,
        email: member.user.email,
        createdAt: member.createdAt.toISOString(),
      }))
    );
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

    if (membership.membership.role !== "owner") {
      return NextResponse.json(
        { error: "Only team owners can add members" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const email =
      typeof body.email === "string" && body.email.includes("@")
        ? body.email.trim()
        : null;

    if (!email) {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 }
      );
    }

    const added = await addTeamMemberByEmail(teamId, email);

    return NextResponse.json({
      id: added.id,
      teamId: added.teamId,
      userId: added.userId,
      role: added.role,
      name: added.user.name,
      email: added.user.email,
      createdAt: added.createdAt.toISOString(),
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
