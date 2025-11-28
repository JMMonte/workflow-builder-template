import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows } from "@/lib/db/schema";
import { requireTeamContext } from "@/lib/team-context";
import { generateId } from "@/lib/utils/id";
import {
  DEFAULT_WORKFLOW_ICON,
  DEFAULT_WORKFLOW_ICON_COLOR,
} from "@/lib/workflow-defaults";

// Helper function to create a default trigger node
function createDefaultTriggerNode() {
  return {
    id: nanoid(),
    type: "trigger" as const,
    position: { x: 0, y: 0 },
    data: {
      label: "",
      description: "",
      type: "trigger" as const,
      config: { triggerType: "Manual" },
      status: "idle" as const,
    },
  };
}

export async function POST(request: Request) {
  try {
    const teamContext = await requireTeamContext(request);

    if (!teamContext.ok) {
      return teamContext.response;
    }

    const body = await request.json();

    if (!(body.name && body.nodes && body.edges)) {
      return NextResponse.json(
        { error: "Name, nodes, and edges are required" },
        { status: 400 }
      );
    }

    // Ensure there's always a trigger node (only add one if nodes array is empty)
    let nodes = body.nodes;
    if (nodes.length === 0) {
      nodes = [createDefaultTriggerNode()];
    }

    // Generate "Untitled N" name if the provided name is "Untitled Workflow"
    let workflowName = body.name;
    if (body.name === "Untitled Workflow") {
      const userWorkflows = await db.query.workflows.findMany({
        where: eq(workflows.teamId, teamContext.team.id),
      });
      const count = userWorkflows.length + 1;
      workflowName = `Untitled ${count}`;
    }

    // Generate workflow ID first
    const workflowId = generateId();
    const icon = body.icon || DEFAULT_WORKFLOW_ICON;
    const iconColor = body.iconColor || DEFAULT_WORKFLOW_ICON_COLOR;

    const [newWorkflow] = await db
      .insert(workflows)
      .values({
        id: workflowId,
        name: workflowName,
        description: body.description,
        icon,
        iconColor,
        nodes,
        edges: body.edges,
        userId: teamContext.session.user.id,
        teamId: teamContext.team.id,
      })
      .returning();

    return NextResponse.json({
      ...newWorkflow,
      createdAt: newWorkflow.createdAt.toISOString(),
      updatedAt: newWorkflow.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to create workflow:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create workflow",
      },
      { status: 500 }
    );
  }
}
