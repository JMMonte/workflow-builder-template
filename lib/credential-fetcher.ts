/**
 * Credential Fetcher
 *
 * SECURITY: Steps should fetch credentials at runtime using only an integration ID reference.
 * This ensures:
 * 1. Credentials are never passed as step parameters (not logged in observability)
 * 2. Credentials are reconstructed in secure, non-persisted contexts (in-memory only)
 * 3. Works for both production and test runs
 *
 * Pattern:
 * - Step input: { integrationId: "abc123", ...otherParams }  ← Safe to log
 * - Step fetches: credentials = await fetchCredentials(integrationId)  ← Not logged
 * - Step uses: apiClient.call(credentials.apiKey)  ← In memory only
 * - Step returns: { result: data }  ← Safe to log (no credentials)
 */
import "server-only";

import { getIntegrationById, type IntegrationConfig } from "./db/integrations";

export type WorkflowCredentials = {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  LINEAR_API_KEY?: string;
  LINEAR_TEAM_ID?: string;
  SLACK_API_KEY?: string;
  AI_GATEWAY_API_KEY?: string;
  DATABASE_URL?: string;
  FIRECRAWL_API_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
  GOOGLE_REDIRECT_URI?: string;
  GOOGLE_SERVICE_ACCOUNT?: string;
  GOOGLE_WORKSPACE_ADMIN_EMAIL?: string;
  GOOGLE_SCOPES?: string;
  GOOGLE_SERVICES?: string;
  MICROSOFT_TENANT_ID?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
  MICROSOFT_REFRESH_TOKEN?: string;
  MICROSOFT_REDIRECT_URI?: string;
  MICROSOFT_AUTHORITY_HOST?: string;
  MICROSOFT_SCOPES?: string;
  MICROSOFT_AUTH_MODE?: "delegated" | "application";
  MICROSOFT_SERVICES?: string;
  CUSTOM?: Record<string, string>;
};

function mapResendConfig(config: IntegrationConfig): WorkflowCredentials {
  const creds: WorkflowCredentials = {};
  if (config.apiKey) {
    creds.RESEND_API_KEY = config.apiKey;
  }
  if (config.fromEmail) {
    creds.RESEND_FROM_EMAIL = config.fromEmail;
  }
  return creds;
}

function mapLinearConfig(config: IntegrationConfig): WorkflowCredentials {
  const creds: WorkflowCredentials = {};
  if (config.apiKey) {
    creds.LINEAR_API_KEY = config.apiKey;
  }
  if (config.teamId) {
    creds.LINEAR_TEAM_ID = config.teamId;
  }
  return creds;
}

function mapSlackConfig(config: IntegrationConfig): WorkflowCredentials {
  const creds: WorkflowCredentials = {};
  if (config.apiKey) {
    creds.SLACK_API_KEY = config.apiKey;
  }
  return creds;
}

function mapDatabaseConfig(config: IntegrationConfig): WorkflowCredentials {
  const creds: WorkflowCredentials = {};
  if (config.url) {
    creds.DATABASE_URL = config.url;
  }
  return creds;
}

function mapAiGatewayConfig(config: IntegrationConfig): WorkflowCredentials {
  const creds: WorkflowCredentials = {};
  if (config.apiKey) {
    creds.AI_GATEWAY_API_KEY = config.apiKey;
  }
  return creds;
}

function mapFirecrawlConfig(config: IntegrationConfig): WorkflowCredentials {
  const creds: WorkflowCredentials = {};
  if (config.firecrawlApiKey) {
    creds.FIRECRAWL_API_KEY = config.firecrawlApiKey;
  }
  return creds;
}

function mapGoogleConfig(config: IntegrationConfig): WorkflowCredentials {
  const creds: WorkflowCredentials = {};

  const useSystem = config.googleCredentialSource === "system";

  const clientId = useSystem
    ? process.env.SYSTEM_GOOGLE_CLIENT_ID
    : config.googleClientId;
  const clientSecret = useSystem
    ? process.env.SYSTEM_GOOGLE_CLIENT_SECRET
    : config.googleClientSecret;
  const redirectUri = useSystem
    ? process.env.SYSTEM_GOOGLE_REDIRECT_URI
    : config.googleRedirectUri;

  if (clientId) {
    creds.GOOGLE_CLIENT_ID = clientId;
  }
  if (clientSecret) {
    creds.GOOGLE_CLIENT_SECRET = clientSecret;
  }
  if (config.googleRefreshToken) {
    creds.GOOGLE_REFRESH_TOKEN = config.googleRefreshToken;
  }
  if (redirectUri) {
    creds.GOOGLE_REDIRECT_URI = redirectUri;
  }
  if (config.googleServiceAccount) {
    creds.GOOGLE_SERVICE_ACCOUNT = config.googleServiceAccount;
  }
  if (config.googleWorkspaceAdminEmail) {
    creds.GOOGLE_WORKSPACE_ADMIN_EMAIL = config.googleWorkspaceAdminEmail;
  }
  if (config.googleScopes) {
    creds.GOOGLE_SCOPES = config.googleScopes;
  }
  if (config.googleServices?.length) {
    creds.GOOGLE_SERVICES = config.googleServices.join(",");
  }

  return creds;
}

function mapMicrosoftConfig(config: IntegrationConfig): WorkflowCredentials {
  const creds: WorkflowCredentials = {};

  const useSystem = config.microsoftCredentialSource === "system";

  const clientId = useSystem
    ? process.env.SYSTEM_MICROSOFT_CLIENT_ID
    : config.microsoftClientId;
  const clientSecret = useSystem
    ? process.env.SYSTEM_MICROSOFT_CLIENT_SECRET
    : config.microsoftClientSecret;
  const authorityHost =
    config.microsoftAuthorityHost ||
    process.env.SYSTEM_MICROSOFT_AUTHORITY_HOST;

  if (config.microsoftTenantId) {
    creds.MICROSOFT_TENANT_ID = config.microsoftTenantId;
  }
  if (clientId) {
    creds.MICROSOFT_CLIENT_ID = clientId;
  }
  if (clientSecret) {
    creds.MICROSOFT_CLIENT_SECRET = clientSecret;
  }
  if (authorityHost) {
    creds.MICROSOFT_AUTHORITY_HOST = authorityHost;
  }
  if (config.microsoftRefreshToken) {
    creds.MICROSOFT_REFRESH_TOKEN = config.microsoftRefreshToken;
  }
  if (config.microsoftRedirectUri) {
    creds.MICROSOFT_REDIRECT_URI = config.microsoftRedirectUri;
  }
  if (config.microsoftScopes) {
    creds.MICROSOFT_SCOPES = config.microsoftScopes;
  }
  if (config.microsoftAuthMode) {
    creds.MICROSOFT_AUTH_MODE = config.microsoftAuthMode;
  }
  if (config.microsoftServices?.length) {
    creds.MICROSOFT_SERVICES = config.microsoftServices.join(",");
  }

  return creds;
}

function mapCustomConfig(config: IntegrationConfig): WorkflowCredentials {
  const fields = config.customFields || [];
  const mapped: Record<string, string> = {};

  for (const field of fields) {
    if (!field.key) {
      continue;
    }
    mapped[field.key] = field.value || "";
  }

  if (Object.keys(mapped).length === 0) {
    return {};
  }

  return { CUSTOM: mapped };
}

/**
 * Map integration config to WorkflowCredentials format
 */
function mapIntegrationConfig(
  integrationType: string,
  config: IntegrationConfig
): WorkflowCredentials {
  if (integrationType === "resend") {
    return mapResendConfig(config);
  }
  if (integrationType === "linear") {
    return mapLinearConfig(config);
  }
  if (integrationType === "slack") {
    return mapSlackConfig(config);
  }
  if (integrationType === "database") {
    return mapDatabaseConfig(config);
  }
  if (integrationType === "ai-gateway") {
    return mapAiGatewayConfig(config);
  }
  if (integrationType === "firecrawl") {
    return mapFirecrawlConfig(config);
  }
  if (integrationType === "google") {
    return mapGoogleConfig(config);
  }
  if (integrationType === "microsoft") {
    return mapMicrosoftConfig(config);
  }
  if (integrationType === "custom") {
    return mapCustomConfig(config);
  }
  return {};
}

/**
 * Fetch credentials for an integration by ID
 *
 * @param integrationId - The ID of the integration to fetch credentials for
 * @returns WorkflowCredentials object with the integration's credentials
 */
export async function fetchCredentials(
  integrationId: string,
  teamId?: string
): Promise<WorkflowCredentials> {
  console.log("[Credential Fetcher] Fetching integration:", integrationId);

  const integration = await getIntegrationById(integrationId, teamId);

  if (!integration) {
    console.log("[Credential Fetcher] Integration not found");
    return {};
  }

  console.log("[Credential Fetcher] Found integration:", integration.type);

  const credentials = mapIntegrationConfig(
    integration.type,
    integration.config
  );

  console.log(
    "[Credential Fetcher] Returning credentials for type:",
    integration.type
  );

  return credentials;
}

/**
 * Legacy function name for backward compatibility
 * Now fetches by integration ID instead of workflow ID
 */
export function fetchIntegrationCredentials(
  integrationId: string,
  teamId?: string
): Promise<WorkflowCredentials> {
  return fetchCredentials(integrationId, teamId);
}
