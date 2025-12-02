import "server-only";

import { fetchCredentials } from "@/lib/credential-fetcher";
import { getErrorMessage } from "@/lib/utils";

export async function readGmailStep(input: {
  integrationId?: string;
  query: string;
  maxResults?: number | string;
}) {
  "use step";

  const credentials = input.integrationId
    ? await fetchCredentials(input.integrationId)
    : {};

  if (!credentials.GOOGLE_REFRESH_TOKEN && !credentials.GOOGLE_SERVICE_ACCOUNT) {
    return {
      success: false,
      error:
        "Google credentials are not configured. Please add them in Project Integrations.",
    };
  }

  try {
    return {
      success: true,
      data: {
        query: input.query,
        maxResults: input.maxResults,
        note: "Read Gmail placeholder. Connect Gmail API here.",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to read Gmail: ${getErrorMessage(error)}`,
    };
  }
}
