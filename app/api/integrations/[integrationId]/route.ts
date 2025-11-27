import { NextResponse } from "next/server";
import {
  deleteIntegration,
  getIntegration,
  type IntegrationConfig,
  type IntegrationType,
  updateIntegration,
} from "@/lib/db/integrations";
import { requireTeamContext } from "@/lib/team-context";

export type GetIntegrationResponse = {
  id: string;
  teamId: string;
  name: string;
  type: IntegrationType;
  config: IntegrationConfig;
  createdAt: string;
  updatedAt: string;
};

export type UpdateIntegrationRequest = {
  name?: string;
  config?: IntegrationConfig;
};

/**
 * GET /api/integrations/[integrationId]
 * Get a single integration with decrypted config
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ integrationId: string }> }
) {
  try {
    const { integrationId } = await context.params;
    const teamContext = await requireTeamContext(request);

    if (!teamContext.ok) {
      return teamContext.response;
    }

    const integration = await getIntegration(
      integrationId,
      teamContext.team.id
    );

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    const response: GetIntegrationResponse = {
      id: integration.id,
      teamId: integration.teamId,
      name: integration.name,
      type: integration.type,
      config: integration.config,
      createdAt: integration.createdAt.toISOString(),
      updatedAt: integration.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to get integration:", error);
    return NextResponse.json(
      {
        error: "Failed to get integration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/integrations/[integrationId]
 * Update an integration
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ integrationId: string }> }
) {
  try {
    const { integrationId } = await context.params;
    const teamContext = await requireTeamContext(request);

    if (!teamContext.ok) {
      return teamContext.response;
    }

    const body: UpdateIntegrationRequest = await request.json();

    const integration = await updateIntegration(
      integrationId,
      teamContext.team.id,
      body
    );

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    const response: GetIntegrationResponse = {
      id: integration.id,
      teamId: integration.teamId,
      name: integration.name,
      type: integration.type,
      config: integration.config,
      createdAt: integration.createdAt.toISOString(),
      updatedAt: integration.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to update integration:", error);
    return NextResponse.json(
      {
        error: "Failed to update integration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/[integrationId]
 * Delete an integration
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ integrationId: string }> }
) {
  try {
    const { integrationId } = await context.params;
    const teamContext = await requireTeamContext(request);

    if (!teamContext.ok) {
      return teamContext.response;
    }

    const success = await deleteIntegration(integrationId, teamContext.team.id);

    if (!success) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete integration:", error);
    return NextResponse.json(
      {
        error: "Failed to delete integration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
