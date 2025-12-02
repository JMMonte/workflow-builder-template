import "server-only";

import { fetchCredentials } from "@/lib/credential-fetcher";
import { getErrorMessage } from "@/lib/utils";

export async function sendOutlookEmailStep(input: {
  integrationId?: string;
  to: string;
  subject: string;
  body: string;
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
        to: input.to,
        subject: input.subject,
        body: input.body,
        note: "Send Outlook Email placeholder. Connect Graph API here.",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to send email: ${getErrorMessage(error)}`,
    };
  }
}
