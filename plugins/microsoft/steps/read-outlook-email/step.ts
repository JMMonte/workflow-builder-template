import "server-only";

import { fetchCredentials } from "@/lib/credential-fetcher";
import { getErrorMessage } from "@/lib/utils";

export async function readOutlookEmailStep(input: {
  integrationId?: string;
  query: string;
  folder?: string;
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
        folder: input.folder,
        maxResults: input.maxResults,
        note: "Read Outlook Email placeholder. Connect Graph Mail API here.",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to read Outlook email: ${getErrorMessage(error)}`,
    };
  }
}
