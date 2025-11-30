import { createGateway } from "ai";
import { NextResponse } from "next/server";
import {
  type DecryptedIntegration,
  getIntegration,
  getIntegrations,
} from "@/lib/db/integrations";
import { requireTeamContext } from "@/lib/team-context";

type AvailableModelsResponse = Awaited<
  ReturnType<ReturnType<typeof createGateway>["getAvailableModels"]>
>;

async function getAiGatewayIntegration(
  teamId: string,
  integrationId?: string | null
): Promise<DecryptedIntegration | null> {
  if (integrationId) {
    const integration = await getIntegration(integrationId, teamId);
    return integration && integration.type === "ai-gateway"
      ? integration
      : null;
  }

  const [firstIntegration] = await getIntegrations(teamId, "ai-gateway");
  return firstIntegration || null;
}

export async function GET(request: Request) {
  try {
    const teamContext = await requireTeamContext(request);

    if (!teamContext.ok) {
      return teamContext.response;
    }

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get("integrationId");

    const integration = await getAiGatewayIntegration(
      teamContext.team.id,
      integrationId
    );

    if (!integration) {
      return NextResponse.json(
        { error: "AI Gateway integration not found" },
        { status: 404 }
      );
    }

    const apiKey = integration.config.apiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI Gateway API key is not configured" },
        { status: 400 }
      );
    }

    const gateway = createGateway({ apiKey });
    const models = await gateway.getAvailableModels();

    return NextResponse.json<AvailableModelsResponse>(models);
  } catch (error) {
    console.error("Failed to fetch AI Gateway models:", error);
    return NextResponse.json(
      { error: "Failed to fetch available models" },
      { status: 500 }
    );
  }
}
