import "server-only";

import { fetchCredentials } from "@/lib/credential-fetcher";
import { getErrorMessage } from "@/lib/utils";

export async function searchOneDriveStep(input: {
  integrationId?: string;
  query: string;
  folderPath?: string;
  maxResults?: number | string;
}) {
  "use step";

  const credentials = input.integrationId
    ? await fetchCredentials(input.integrationId)
    : {};

  if (!credentials.MICROSOFT_CLIENT_ID || !credentials.MICROSOFT_CLIENT_SECRET) {
    return {
      success: false,
      error:
        "Microsoft credentials are not configured. Please add them in Project Integrations.",
    };
  }

  try {
    return {
      success: true,
      data: {
        query: input.query,
        folderPath: input.folderPath,
        maxResults: input.maxResults,
        note: "Search OneDrive placeholder. Connect Graph Drive API here.",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to search OneDrive: ${getErrorMessage(error)}`,
    };
  }
}
