import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createTeamForUser,
  ensureUserTeam,
  getTeamsForUser,
} from "@/lib/db/teams";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure the user has at least one team
    await ensureUserTeam(session.user.id);

    const teams = await getTeamsForUser(session.user.id);

    return NextResponse.json(
      teams.map((team) => ({
        ...team,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Failed to list teams:", error);
    return NextResponse.json(
      {
        error: "Failed to list teams",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const name =
      typeof body.name === "string" && body.name.trim().length > 0
        ? body.name.trim()
        : "New Team";

    const { team, membership } = await createTeamForUser(session.user.id, name);

    return NextResponse.json({
      ...team,
      role: membership.role,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to create team:", error);
    return NextResponse.json(
      {
        error: "Failed to create team",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
