import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows } from "@/lib/db/schema";
import { requireTeamContext } from "@/lib/team-context";

export async function GET(request: Request) {
  try {
    const teamContext = await requireTeamContext(request);

    if (!teamContext.ok) {
      return teamContext.response;
    }

    const userWorkflows = await db
      .select()
      .from(workflows)
      .where(eq(workflows.teamId, teamContext.team.id))
      .orderBy(desc(workflows.updatedAt));

    const mappedWorkflows = userWorkflows.map((workflow) => ({
      ...workflow,
      teamId: workflow.teamId,
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString(),
    }));

    return NextResponse.json(mappedWorkflows);
  } catch (error) {
    console.error("Failed to get workflows:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get workflows",
      },
      { status: 500 }
    );
  }
}
