import "server-only";

import { fetchCredentials } from "@/lib/credential-fetcher";
import { getErrorMessage } from "@/lib/utils";

export async function listGoogleEventsStep(input: {
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
        calendarId: input.calendarId || "primary",
        timeMin: input.timeMin,
        timeMax: input.timeMax,
        maxResults: input.maxResults,
        note: "List Google Calendar Events placeholder. Connect Calendar API here.",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to list events: ${getErrorMessage(error)}`,
    };
  }
}
