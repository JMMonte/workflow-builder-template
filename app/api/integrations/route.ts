import { NextResponse } from "next/server";
import {
  createIntegration,
  getIntegrations,
  type IntegrationConfig,
  type IntegrationType,
} from "@/lib/db/integrations";
import { requireTeamContext } from "@/lib/team-context";

export type GetIntegrationsResponse = {
  id: string;
  teamId: string;
  name: string;
  type: IntegrationType;
  createdAt: string;
  updatedAt: string;
  // Config is intentionally excluded for security
}[];

export type CreateIntegrationRequest = {
  name: string;
  type: IntegrationType;
  config: IntegrationConfig;
};

export type CreateIntegrationResponse = {
  id: string;
  teamId: string;
  name: string;
  type: IntegrationType;
  createdAt: string;
  updatedAt: string;
};

/**
 * GET /api/integrations
 * List all integrations for the authenticated user
 */
export async function GET(request: Request) {
  try {
    const teamContext = await requireTeamContext(request);

    if (!teamContext.ok) {
      return teamContext.response;
    }

    // Get optional type filter from query params
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type") as IntegrationType | null;

    const integrations = await getIntegrations(
      teamContext.team.id,
      typeFilter || undefined
    );

    // Return integrations without config for security
    const response: GetIntegrationsResponse = integrations.map(
      (integration) => ({
        id: integration.id,
        teamId: integration.teamId,
        name: integration.name,
        type: integration.type,
        createdAt: integration.createdAt.toISOString(),
        updatedAt: integration.updatedAt.toISOString(),
      })
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to get integrations:", error);
    return NextResponse.json(
      {
        error: "Failed to get integrations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations
 * Create a new integration
 */
export async function POST(request: Request) {
  try {
    const teamContext = await requireTeamContext(request);

    if (!teamContext.ok) {
      return teamContext.response;
    }

    const body: CreateIntegrationRequest = await request.json();

    if (!(body.name && body.type && body.config)) {
      return NextResponse.json(
        { error: "Name, type, and config are required" },
        { status: 400 }
      );
    }

    const integration = await createIntegration({
      teamId: teamContext.team.id,
      userId: teamContext.session.user.id,
      name: body.name,
      type: body.type,
      config: body.config,
    });

    const response: CreateIntegrationResponse = {
      id: integration.id,
      teamId: integration.teamId,
      name: integration.name,
      type: integration.type,
      createdAt: integration.createdAt.toISOString(),
      updatedAt: integration.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to create integration:", error);
    return NextResponse.json(
      {
        error: "Failed to create integration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
