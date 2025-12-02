import "server-only";

import { fetchCredentials } from "@/lib/credential-fetcher";
import { getErrorMessage } from "@/lib/utils";

export async function createGoogleEventStep(input: {
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
        title: input.title,
        start: input.start,
        end: input.end,
        description: input.description,
        note: "Create Google Calendar Event placeholder. Connect Calendar API here.",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create event: ${getErrorMessage(error)}`,
    };
  }
}
