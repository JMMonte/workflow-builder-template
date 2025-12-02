import "server-only";

import { fetchCredentials } from "@/lib/credential-fetcher";
import { getErrorMessage } from "@/lib/utils";

export async function createTeamsMessageStep(input: {
  integrationId?: string;
  teamId: string;
  channelId: string;
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
        teamId: input.teamId,
        channelId: input.channelId,
        content: input.content,
        note: "Create Teams Message placeholder. Connect Graph API here.",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to send Teams message: ${getErrorMessage(error)}`,
    };
  }
}
