import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { integrations, teamMembers, teams, workflows } from "@/lib/db/schema";
import { requireTeamContext } from "@/lib/team-context";

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function buildUpdateData(
  body: unknown
): { data: Partial<typeof teams.$inferInsert> } | { error: string } {
  const parsed = (
    typeof body === "object" && body !== null ? body : {}
  ) as Record<string, unknown>;

  const name = normalizeOptionalString(parsed.name);
  const icon = normalizeOptionalString(parsed.icon);
  const iconColor = normalizeOptionalString(parsed.iconColor);
  const imageUrl = normalizeOptionalString(parsed.imageUrl);

  const updateData: Partial<typeof teams.$inferInsert> = {};

  if (name !== undefined) {
    if (!name) {
      return { error: "Team name is required" };
    }
    updateData.name = name;
  }

  if (icon !== undefined) {
    updateData.icon = icon || null;
  }

  if (iconColor !== undefined) {
    updateData.iconColor = iconColor || null;
  }

  if (imageUrl !== undefined) {
    updateData.imageUrl = imageUrl || null;
  }

  if (Object.keys(updateData).length === 0) {
    return { error: "No updates provided" };
  }

  updateData.updatedAt = new Date();

  return { data: updateData };
}

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
        { error: "Only owners can update the team" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const updateResult = buildUpdateData(body);

    if ("error" in updateResult) {
      return NextResponse.json({ error: updateResult.error }, { status: 400 });
    }

    const [updated] = await db
      .update(teams)
      .set(updateResult.data)
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
