import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows } from "@/lib/db/schema";
import { requireTeamContext } from "@/lib/team-context";

export async function GET(
  request: Request,
  context: { params: Promise<{ workflowId: string }> }
) {
  try {
    const { workflowId } = await context.params;
    const teamContext = await requireTeamContext(request);

    if (!teamContext.ok) {
      return teamContext.response;
    }

    const workflow = await db.query.workflows.findFirst({
      where: and(
        eq(workflows.id, workflowId),
        eq(workflows.teamId, teamContext.team.id)
      ),
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...workflow,
      teamId: workflow.teamId,
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to get workflow:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get workflow",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ workflowId: string }> }
) {
  try {
    const { workflowId } = await context.params;
    const teamContext = await requireTeamContext(request);

    if (!teamContext.ok) {
      return teamContext.response;
    }

    // Verify ownership
    const existingWorkflow = await db.query.workflows.findFirst({
      where: and(
        eq(workflows.id, workflowId),
        eq(workflows.teamId, teamContext.team.id)
      ),
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.icon !== undefined) {
      updateData.icon = body.icon;
    }
    if (body.iconColor !== undefined) {
      updateData.iconColor = body.iconColor;
    }
    if (body.nodes !== undefined) {
      updateData.nodes = body.nodes;
    }
    if (body.edges !== undefined) {
      updateData.edges = body.edges;
    }

    const [updatedWorkflow] = await db
      .update(workflows)
      .set(updateData)
      .where(eq(workflows.id, workflowId))
      .returning();

    if (!updatedWorkflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...updatedWorkflow,
      teamId: updatedWorkflow.teamId,
      createdAt: updatedWorkflow.createdAt.toISOString(),
      updatedAt: updatedWorkflow.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to update workflow:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update workflow",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ workflowId: string }> }
) {
  try {
    const { workflowId } = await context.params;
    const teamContext = await requireTeamContext(request);

    if (!teamContext.ok) {
      return teamContext.response;
    }

    // Verify ownership
    const existingWorkflow = await db.query.workflows.findFirst({
      where: and(
        eq(workflows.id, workflowId),
        eq(workflows.teamId, teamContext.team.id)
      ),
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    await db.delete(workflows).where(eq(workflows.id, workflowId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete workflow:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete workflow",
      },
      { status: 500 }
    );
  }
}
