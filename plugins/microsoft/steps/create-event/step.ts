import "server-only";

import { fetchCredentials } from "@/lib/credential-fetcher";
import { getErrorMessage } from "@/lib/utils";

export async function createMicrosoftEventStep(input: {
  integrationId?: string;
  title: string;
  start: string;
  end: string;
  description?: string;
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
        title: input.title,
        start: input.start,
        end: input.end,
        description: input.description,
        note: "Create Microsoft Event placeholder. Connect Graph Calendar API here.",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create event: ${getErrorMessage(error)}`,
    };
  }
}
