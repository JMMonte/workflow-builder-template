import { CalendarDays, Mail, Search, UploadCloud } from "lucide-react";
import type { IntegrationPlugin } from "../registry";
import { registerIntegration } from "../registry";
import { sendGmailCodegenTemplate } from "./codegen/send-gmail";
import { createGoogleEventCodegenTemplate } from "./codegen/create-event";
import { uploadDriveFileCodegenTemplate } from "./codegen/upload-drive-file";
import { readGmailCodegenTemplate } from "./codegen/read-gmail";
import { searchDriveCodegenTemplate } from "./codegen/search-drive";
import { listGoogleEventsCodegenTemplate } from "./codegen/list-events";
import { GoogleSettings } from "./settings";
import { SendGmailConfigFields } from "./steps/send-gmail/config";
import { CreateGoogleEventConfigFields } from "./steps/create-event/config";
import { UploadDriveFileConfigFields } from "./steps/upload-drive-file/config";
import { ReadGmailConfigFields } from "./steps/read-gmail/config";
import { SearchDriveConfigFields } from "./steps/search-drive/config";
import { ListGoogleEventsConfigFields } from "./steps/list-events/config";

const googlePlugin: IntegrationPlugin = {
  type: "google",
  label: "Google Workspace",
  description: "Gmail, Drive, and Calendar",

  icon: {
    type: "image",
    value: "/integrations/google.svg",
  },

  settingsComponent: GoogleSettings,

  formFields: [],

  credentialMapping: (config) => {
    const creds: Record<string, string> = {};
    if (config.googleClientId) {
      creds.GOOGLE_CLIENT_ID = String(config.googleClientId);
    }
    if (config.googleClientSecret) {
      creds.GOOGLE_CLIENT_SECRET = String(config.googleClientSecret);
    }
    if (config.googleRefreshToken) {
      creds.GOOGLE_REFRESH_TOKEN = String(config.googleRefreshToken);
    }
    if (config.googleRedirectUri) {
      creds.GOOGLE_REDIRECT_URI = String(config.googleRedirectUri);
    }
    if (config.googleServiceAccount) {
      creds.GOOGLE_SERVICE_ACCOUNT = String(config.googleServiceAccount);
    }
    if (config.googleWorkspaceAdminEmail) {
      creds.GOOGLE_WORKSPACE_ADMIN_EMAIL = String(
        config.googleWorkspaceAdminEmail
      );
    }
    if (config.googleScopes) {
      creds.GOOGLE_SCOPES = String(config.googleScopes);
    }
    if (Array.isArray(config.googleServices) && config.googleServices.length) {
      creds.GOOGLE_SERVICES = config.googleServices.join(",");
    }
    if (config.googleCredentialSource) {
      creds.GOOGLE_CREDENTIAL_SOURCE = String(config.googleCredentialSource);
    }
    return creds;
  },

  actions: [
    {
      id: "Send Gmail",
      label: "Send Gmail",
      description: "Send an email via Gmail",
      category: "Google Gmail",
      icon: Mail,
      stepFunction: "sendGmailStep",
      stepImportPath: "send-gmail",
      configFields: SendGmailConfigFields,
      codegenTemplate: sendGmailCodegenTemplate,
    },
    {
      id: "Read Gmail",
      label: "Read Gmail",
      description: "Fetch recent Gmail messages",
      category: "Google Gmail",
      icon: Search,
      stepFunction: "readGmailStep",
      stepImportPath: "read-gmail",
      configFields: ReadGmailConfigFields,
      codegenTemplate: readGmailCodegenTemplate,
    },
    {
      id: "Create Google Calendar Event",
      label: "Create Calendar Event",
      description: "Create an event in Google Calendar",
      category: "Google Calendar",
      icon: CalendarDays,
      stepFunction: "createGoogleEventStep",
      stepImportPath: "create-event",
      configFields: CreateGoogleEventConfigFields,
      codegenTemplate: createGoogleEventCodegenTemplate,
    },
    {
      id: "List Google Calendar Events",
      label: "List Calendar Events",
      description: "List events from Google Calendar",
      category: "Google Calendar",
      icon: CalendarDays,
      stepFunction: "listGoogleEventsStep",
      stepImportPath: "list-events",
      configFields: ListGoogleEventsConfigFields,
      codegenTemplate: listGoogleEventsCodegenTemplate,
    },
    {
      id: "Upload Drive File",
      label: "Upload Drive File",
      description: "Store a file in Google Drive",
      category: "Google Drive",
      icon: UploadCloud,
      stepFunction: "uploadDriveFileStep",
      stepImportPath: "upload-drive-file",
      configFields: UploadDriveFileConfigFields,
      codegenTemplate: uploadDriveFileCodegenTemplate,
    },
    {
      id: "Search Drive",
      label: "Search Drive",
      description: "Search files in Google Drive",
      category: "Google Drive",
      icon: Search,
      stepFunction: "searchDriveStep",
      stepImportPath: "search-drive",
      configFields: SearchDriveConfigFields,
      codegenTemplate: searchDriveCodegenTemplate,
    },
  ],
};

registerIntegration(googlePlugin);

export default googlePlugin;
