import "server-only";

import { fetchCredentials } from "@/lib/credential-fetcher";
import { getErrorMessage } from "@/lib/utils";

export async function uploadDriveFileStep(input: {
  integrationId?: string;
  fileUrl: string;
  folderId?: string;
  mimeType?: string;
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
        fileUrl: input.fileUrl,
        folderId: input.folderId,
        mimeType: input.mimeType,
        note: "Upload Drive File placeholder. Connect Google Drive API here.",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to upload file: ${getErrorMessage(error)}`,
    };
  }
}
