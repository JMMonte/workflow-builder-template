import "server-only";

import { fetchCredentials } from "@/lib/credential-fetcher";
import { getErrorMessage } from "@/lib/utils";

export async function listMicrosoftEventsStep(input: {
  integrationId?: string;
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
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
        calendarId: input.calendarId || "primary",
        timeMin: input.timeMin,
        timeMax: input.timeMax,
        maxResults: input.maxResults,
        note: "List Microsoft Calendar Events placeholder. Connect Graph Calendar API here.",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to list events: ${getErrorMessage(error)}`,
    };
  }
}
