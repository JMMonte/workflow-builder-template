import "server-only";

import { fetchCredentials } from "@/lib/credential-fetcher";
import { getErrorMessage } from "@/lib/utils";

export async function uploadOneDriveFileStep(input: {
  integrationId?: string;
  fileUrl: string;
  folderPath?: string;
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
        fileUrl: input.fileUrl,
        folderPath: input.folderPath,
        note: "Upload OneDrive File placeholder. Connect Graph API here.",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to upload file: ${getErrorMessage(error)}`,
    };
  }
}
