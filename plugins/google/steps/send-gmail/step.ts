import "server-only";

import { fetchCredentials } from "@/lib/credential-fetcher";
import { getErrorMessage } from "@/lib/utils";

export async function sendGmailStep(input: {
  integrationId?: string;
  to: string;
  subject: string;
  body: string;
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
        to: input.to,
        subject: input.subject,
        body: input.body,
        note: "Send Gmail action placeholder. Connect real Gmail API here.",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to send Gmail: ${getErrorMessage(error)}`,
    };
  }
}
