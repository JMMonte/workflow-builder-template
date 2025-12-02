import "server-only";

import { fetchCredentials } from "@/lib/credential-fetcher";
import { getErrorMessage } from "@/lib/utils";

export async function searchDriveStep(input: {
  integrationId?: string;
  query: string;
  limit?: number | string;
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
        limit: input.limit,
        note: "Search Drive placeholder. Connect Drive API here.",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to search Drive: ${getErrorMessage(error)}`,
    };
  }
}
