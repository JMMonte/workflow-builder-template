import "server-only";

import { fetchCredentials } from "@/lib/credential-fetcher";
import { getErrorMessage } from "@/lib/utils";

export async function createSharePointPageStep(input: {
  integrationId?: string;
  siteId: string;
  title: string;
  content: string;
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
        siteId: input.siteId,
        title: input.title,
        content: input.content,
        note: "Create SharePoint Page placeholder. Connect Graph API here.",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create SharePoint page: ${getErrorMessage(error)}`,
    };
  }
}
