import { LinearClient } from "@linear/sdk";
import FirecrawlApp from "@mendable/firecrawl-js";
import { WebClient } from "@slack/web-api";
import { createGateway } from "ai";
import { NextResponse } from "next/server";
import postgres from "postgres";
import { Resend } from "resend";
import { getIntegration, type IntegrationConfig } from "@/lib/db/integrations";
import { requireTeamContext } from "@/lib/team-context";

const TRAILING_SLASH_REGEX = /\/$/;

export type TestConnectionResult = {
  status: "success" | "error";
  message: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const teamContext = await requireTeamContext(request);

    if (!teamContext.ok) {
      return teamContext.response;
    }

    const { integrationId } = await params;

    if (!integrationId) {
      return NextResponse.json(
        { error: "integrationId is required" },
        { status: 400 }
      );
    }

    // Get the integration
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

    let result: TestConnectionResult;

    switch (integration.type) {
      case "linear":
        result = await testLinearConnection(integration.config.apiKey);
        break;
      case "slack":
        result = await testSlackConnection(integration.config.apiKey);
        break;
      case "resend":
        result = await testResendConnection(integration.config.apiKey);
        break;
      case "ai-gateway":
        result = await testAiGatewayConnection(integration.config.apiKey);
        break;
      case "database":
        result = await testDatabaseConnection(integration.config.url);
        break;
      case "firecrawl":
        result = await testFirecrawlConnection(
          integration.config.firecrawlApiKey
        );
        break;
      case "google":
        result = await testGoogleConnection(integration.config);
        break;
      case "microsoft":
        result = await testMicrosoftConnection(integration.config);
        break;
      case "custom":
        result = {
          status: "success",
          message: "Custom integrations do not require a connection test",
        };
        break;
      default:
        return NextResponse.json(
          { error: "Invalid integration type" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to test connection:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to test connection",
      },
      { status: 500 }
    );
  }
}

async function testLinearConnection(
  apiKey?: string
): Promise<TestConnectionResult> {
  try {
    if (!apiKey) {
      return {
        status: "error",
        message: "Connection failed",
      };
    }

    const client = new LinearClient({ apiKey });
    await client.viewer;

    return {
      status: "success",
      message: "Connection successful",
    };
  } catch {
    return {
      status: "error",
      message: "Connection failed",
    };
  }
}

async function testSlackConnection(
  apiKey?: string
): Promise<TestConnectionResult> {
  try {
    if (!apiKey) {
      return {
        status: "error",
        message: "Connection failed",
      };
    }

    const client = new WebClient(apiKey);
    const slackAuth = await client.auth.test();

    if (!slackAuth.ok) {
      return {
        status: "error",
        message: slackAuth.error || "Connection failed",
      };
    }

    return {
      status: "success",
      message: "Connection successful",
    };
  } catch {
    return {
      status: "error",
      message: "Connection failed",
    };
  }
}

async function testResendConnection(
  apiKey?: string
): Promise<TestConnectionResult> {
  try {
    if (!apiKey) {
      return {
        status: "error",
        message: "Connection failed",
      };
    }

    const resend = new Resend(apiKey);
    const domains = await resend.domains.list();

    if (!domains.data) {
      return {
        status: "error",
        message: "Connection failed",
      };
    }

    return {
      status: "success",
      message: "Connection successful",
    };
  } catch {
    return {
      status: "error",
      message: "Connection failed",
    };
  }
}

async function testAiGatewayConnection(
  apiKey?: string
): Promise<TestConnectionResult> {
  try {
    if (!apiKey) {
      return {
        status: "error",
        message: "Connection failed",
      };
    }

    // Test the Vercel AI Gateway by checking credits
    const gateway = createGateway({ apiKey });
    await gateway.getCredits();

    return {
      status: "success",
      message: "Connection successful",
    };
  } catch {
    return {
      status: "error",
      message: "Connection failed",
    };
  }
}

async function testDatabaseConnection(
  databaseUrl?: string
): Promise<TestConnectionResult> {
  let connection: postgres.Sql | null = null;

  try {
    if (!databaseUrl) {
      return {
        status: "error",
        message: "Connection failed",
      };
    }

    // Create a connection
    connection = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 5,
      connect_timeout: 5,
    });

    // Try a simple query
    await connection`SELECT 1`;

    return {
      status: "success",
      message: "Connection successful",
    };
  } catch {
    return {
      status: "error",
      message: "Connection failed",
    };
  } finally {
    // Clean up the connection
    if (connection) {
      await connection.end();
    }
  }
}

async function testFirecrawlConnection(
  apiKey?: string
): Promise<TestConnectionResult> {
  try {
    if (!apiKey) {
      return {
        status: "error",
        message: "Firecrawl API Key is not configured",
      };
    }

    const app = new FirecrawlApp({ apiKey });
    const result = await app.scrape("https://firecrawl.dev", {
      formats: ["markdown"],
    });

    if (!result) {
      return {
        status: "error",
        message: "Authentication or scrape failed",
      };
    }

    return {
      status: "success",
      message: "Connected successfully",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

function joinServices(services?: string[]): string {
  return Array.isArray(services) && services.length > 0
    ? services.join(", ")
    : "none selected";
}

function testGoogleConnection(config: IntegrationConfig): TestConnectionResult {
  const useSystem = config.googleCredentialSource === "system";
  const clientId = useSystem
    ? process.env.SYSTEM_GOOGLE_CLIENT_ID
    : config.googleClientId;
  const clientSecret = useSystem
    ? process.env.SYSTEM_GOOGLE_CLIENT_SECRET
    : config.googleClientSecret;

  const hasOAuthTriplet =
    Boolean(clientId) &&
    Boolean(clientSecret) &&
    Boolean(config.googleRefreshToken);
  const hasServiceAccount = Boolean(config.googleServiceAccount);

  if (!(hasOAuthTriplet || hasServiceAccount)) {
    return {
      status: "error",
      message:
        "Provide OAuth credentials (Client ID/Secret/Refresh Token) or a Service Account JSON blob",
    };
  }

  if (config.googleServiceAccount) {
    try {
      const parsed = JSON.parse(config.googleServiceAccount);
      const hasRequiredServiceAccountFields =
        typeof parsed === "object" &&
        parsed !== null &&
        parsed.client_email &&
        parsed.private_key;

      if (!hasRequiredServiceAccountFields) {
        return {
          status: "error",
          message: "Service account JSON is missing client_email/private_key",
        };
      }
    } catch (error) {
      return {
        status: "error",
        message:
          error instanceof Error
            ? `Invalid service account JSON: ${error.message}`
            : "Invalid service account JSON",
      };
    }
  }

  const scopes =
    config.googleScopes?.trim() ||
    "https://www.googleapis.com/auth/gmail.send, https://www.googleapis.com/auth/drive, https://www.googleapis.com/auth/calendar";

  return {
    status: "success",
    message: `Credentials look valid. Scopes: ${scopes}. Services: ${joinServices(config.googleServices)}`,
  };
}

async function testMicrosoftConnection(
  config: IntegrationConfig
): Promise<TestConnectionResult> {
  const mode = config.microsoftAuthMode || "application";
  const hasTenant = Boolean(config.microsoftTenantId);
  const useSystem = config.microsoftCredentialSource === "system";
  const clientId = useSystem
    ? process.env.SYSTEM_MICROSOFT_CLIENT_ID
    : config.microsoftClientId;
  const clientSecret = useSystem
    ? process.env.SYSTEM_MICROSOFT_CLIENT_SECRET
    : config.microsoftClientSecret;
  const authorityHost =
    config.microsoftAuthorityHost ||
    process.env.SYSTEM_MICROSOFT_AUTHORITY_HOST ||
    "https://login.microsoftonline.com";
  const hasClient = Boolean(clientId) && Boolean(clientSecret);
  const hasRefreshToken = Boolean(config.microsoftRefreshToken);

  if (mode === "delegated") {
    if (!(hasTenant && hasClient && hasRefreshToken)) {
      return {
        status: "error",
        message:
          "Delegated flow requires Tenant ID, Client ID, Client Secret, and a refresh token",
      };
    }

    const scopes =
      config.microsoftScopes?.trim() ||
      "offline_access https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Calendars.ReadWrite";

    return await exchangeMicrosoftToken({
      tenantId: config.microsoftTenantId as string,
      clientId: clientId as string,
      clientSecret: clientSecret as string,
      authorityHost,
      scopes,
      grantType: "refresh_token",
      refreshToken: config.microsoftRefreshToken,
      redirectUri: config.microsoftRedirectUri,
    });
  }

  if (!(hasTenant && hasClient)) {
    return {
      status: "error",
      message:
        "Application flow requires Tenant ID, Client ID, and Client Secret",
    };
  }

  const scopes =
    config.microsoftScopes?.trim() || "https://graph.microsoft.com/.default";

  return await exchangeMicrosoftToken({
    tenantId: config.microsoftTenantId as string,
    clientId: clientId as string,
    clientSecret: clientSecret as string,
    authorityHost,
    scopes,
    grantType: "client_credentials",
  });
}

async function exchangeMicrosoftToken(options: {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  authorityHost: string;
  scopes: string;
  grantType: "client_credentials" | "refresh_token";
  refreshToken?: string;
  redirectUri?: string;
}): Promise<TestConnectionResult> {
  try {
    const tokenEndpoint = `${options.authorityHost.replace(TRAILING_SLASH_REGEX, "")}/${options.tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append("client_id", options.clientId);
    params.append("client_secret", options.clientSecret);
    params.append("scope", options.scopes);
    params.append("grant_type", options.grantType);

    if (options.grantType === "refresh_token") {
      if (!options.refreshToken) {
        return {
          status: "error",
          message: "Missing refresh token for delegated flow",
        };
      }
      params.append("refresh_token", options.refreshToken);
      if (options.redirectUri) {
        params.append("redirect_uri", options.redirectUri);
      }
    }

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        status: "error",
        message: `Token request failed (${response.status}): ${errorBody}`,
      };
    }

    const body = (await response.json()) as { access_token?: string };

    if (!body.access_token) {
      return {
        status: "error",
        message: "Token response missing access_token",
      };
    }

    return {
      status: "success",
      message: "Token acquired successfully",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to get token",
    };
  }
}
