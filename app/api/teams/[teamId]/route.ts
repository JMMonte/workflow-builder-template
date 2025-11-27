import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { integrations, teamMembers, teams, workflows } from "@/lib/db/schema";
import { requireTeamContext } from "@/lib/team-context";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await context.params;
    const teamContext = await requireTeamContext(request);

    if (!teamContext.ok) {
      return teamContext.response;
    }

    if (teamContext.membership.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can rename the team" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const name =
      typeof body.name === "string" && body.name.trim().length > 0
        ? body.name.trim()
        : null;

    if (!name) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(teams)
      .set({ name, updatedAt: new Date() })
      .where(eq(teams.id, teamId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...updated,
      role: teamContext.membership.role,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to update team:", error);
    return NextResponse.json(
      {
        error: "Failed to update team",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await context.params;
    const teamContext = await requireTeamContext(request);

    if (!teamContext.ok) {
      return teamContext.response;
    }

    if (teamContext.membership.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can delete the team" },
        { status: 403 }
      );
    }

    // Prevent deleting team with data attached
    const [{ workflowCount }] = await db
      .select({ workflowCount: count() })
      .from(workflows)
      .where(eq(workflows.teamId, teamId));

    const [{ integrationCount }] = await db
      .select({ integrationCount: count() })
      .from(integrations)
      .where(eq(integrations.teamId, teamId));

    if (Number(workflowCount) > 0 || Number(integrationCount) > 0) {
      return NextResponse.json(
        {
          error:
            "Delete blocked. Move or remove workflows and integrations before deleting the team.",
        },
        { status: 400 }
      );
    }

    await db.transaction(async (tx) => {
      await tx.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
      await tx.delete(teams).where(eq(teams.id, teamId));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete team:", error);
    return NextResponse.json(
      {
        error: "Failed to delete team",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
