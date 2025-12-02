import { CalendarClock, Mail, MessageSquare, UploadCloud, FileText, Search } from "lucide-react";
import type { IntegrationPlugin } from "../registry";
import { registerIntegration } from "../registry";
import { MicrosoftSettings } from "./settings";
import { sendOutlookEmailCodegenTemplate } from "./codegen/send-outlook-email";
import { createTeamsMessageCodegenTemplate } from "./codegen/create-teams-message";
import { uploadOneDriveFileCodegenTemplate } from "./codegen/upload-onedrive-file";
import { createSharePointPageCodegenTemplate } from "./codegen/create-sharepoint-page";
import { createMicrosoftEventCodegenTemplate } from "./codegen/create-event";
import { readOutlookEmailCodegenTemplate } from "./codegen/read-outlook-email";
import { searchOneDriveCodegenTemplate } from "./codegen/search-onedrive";
import { listMicrosoftEventsCodegenTemplate } from "./codegen/list-ms-events";
import { SendOutlookEmailConfigFields } from "./steps/send-outlook-email/config";
import { CreateTeamsMessageConfigFields } from "./steps/create-teams-message/config";
import { UploadOneDriveFileConfigFields } from "./steps/upload-onedrive-file/config";
import { CreateSharePointPageConfigFields } from "./steps/create-sharepoint-page/config";
import { CreateMicrosoftEventConfigFields } from "./steps/create-event/config";
import { ReadOutlookEmailConfigFields } from "./steps/read-outlook-email/config";
import { SearchOneDriveConfigFields } from "./steps/search-onedrive/config";
import { ListMicrosoftEventsConfigFields } from "./steps/list-ms-events/config";

const microsoftPlugin: IntegrationPlugin = {
  type: "microsoft",
  label: "Microsoft 365",
  description: "Outlook, Teams, OneDrive, SharePoint, and Calendar",

  icon: {
    type: "image",
    value: "/integrations/microsoft.svg",
  },

  settingsComponent: MicrosoftSettings,

  formFields: [],

  credentialMapping: (config) => {
    const creds: Record<string, string> = {};
    if (config.microsoftTenantId) {
      creds.MICROSOFT_TENANT_ID = String(config.microsoftTenantId);
    }
    if (config.microsoftClientId) {
      creds.MICROSOFT_CLIENT_ID = String(config.microsoftClientId);
    }
    if (config.microsoftClientSecret) {
      creds.MICROSOFT_CLIENT_SECRET = String(config.microsoftClientSecret);
    }
    if (config.microsoftRefreshToken) {
      creds.MICROSOFT_REFRESH_TOKEN = String(config.microsoftRefreshToken);
    }
    if (config.microsoftRedirectUri) {
      creds.MICROSOFT_REDIRECT_URI = String(config.microsoftRedirectUri);
    }
    if (config.microsoftAuthorityHost) {
      creds.MICROSOFT_AUTHORITY_HOST = String(config.microsoftAuthorityHost);
    }
    if (config.microsoftScopes) {
      creds.MICROSOFT_SCOPES = String(config.microsoftScopes);
    }
    if (config.microsoftAuthMode) {
      creds.MICROSOFT_AUTH_MODE = String(config.microsoftAuthMode);
    }
    if (
      Array.isArray(config.microsoftServices) &&
      config.microsoftServices.length
    ) {
      creds.MICROSOFT_SERVICES = config.microsoftServices.join(",");
    }
    if (config.microsoftCredentialSource) {
      creds.MICROSOFT_CREDENTIAL_SOURCE = String(
        config.microsoftCredentialSource
      );
    }
    return creds;
  },

  actions: [
    {
      id: "Send Outlook Email",
      label: "Send Outlook Email",
      description: "Send an email via Outlook",
      category: "Microsoft Outlook",
      icon: Mail,
      stepFunction: "sendOutlookEmailStep",
      stepImportPath: "send-outlook-email",
      configFields: SendOutlookEmailConfigFields,
      codegenTemplate: sendOutlookEmailCodegenTemplate,
    },
    {
      id: "Read Outlook Email",
      label: "Read Outlook Email",
      description: "Fetch recent Outlook messages",
      category: "Microsoft Outlook",
      icon: Search,
      stepFunction: "readOutlookEmailStep",
      stepImportPath: "read-outlook-email",
      configFields: ReadOutlookEmailConfigFields,
      codegenTemplate: readOutlookEmailCodegenTemplate,
    },
    {
      id: "Create Teams Message",
      label: "Create Teams Message",
      description: "Post a message to Teams",
      category: "Microsoft Teams",
      icon: MessageSquare,
      stepFunction: "createTeamsMessageStep",
      stepImportPath: "create-teams-message",
      configFields: CreateTeamsMessageConfigFields,
      codegenTemplate: createTeamsMessageCodegenTemplate,
    },
    {
      id: "Upload OneDrive File",
      label: "Upload OneDrive File",
      description: "Upload a file to OneDrive",
      category: "Microsoft OneDrive",
      icon: UploadCloud,
      stepFunction: "uploadOneDriveFileStep",
      stepImportPath: "upload-onedrive-file",
      configFields: UploadOneDriveFileConfigFields,
      codegenTemplate: uploadOneDriveFileCodegenTemplate,
    },
    {
      id: "Create SharePoint Page",
      label: "Create SharePoint Page",
      description: "Publish a SharePoint page",
      category: "Microsoft SharePoint",
      icon: FileText,
      stepFunction: "createSharePointPageStep",
      stepImportPath: "create-sharepoint-page",
      configFields: CreateSharePointPageConfigFields,
      codegenTemplate: createSharePointPageCodegenTemplate,
    },
    {
      id: "Create Microsoft Event",
      label: "Create Calendar Event",
      description: "Create an event in Outlook Calendar",
      category: "Microsoft Calendar",
      icon: CalendarClock,
      stepFunction: "createMicrosoftEventStep",
      stepImportPath: "create-event",
      configFields: CreateMicrosoftEventConfigFields,
      codegenTemplate: createMicrosoftEventCodegenTemplate,
    },
    {
      id: "Search OneDrive",
      label: "Search OneDrive",
      description: "Search files in OneDrive",
      category: "Microsoft OneDrive",
      icon: Search,
      stepFunction: "searchOneDriveStep",
      stepImportPath: "search-onedrive",
      configFields: SearchOneDriveConfigFields,
      codegenTemplate: searchOneDriveCodegenTemplate,
    },
    {
      id: "List Microsoft Events",
      label: "List Calendar Events",
      description: "List events from Outlook Calendar",
      category: "Microsoft Calendar",
      icon: CalendarClock,
      stepFunction: "listMicrosoftEventsStep",
      stepImportPath: "list-ms-events",
      configFields: ListMicrosoftEventsConfigFields,
      codegenTemplate: listMicrosoftEventsCodegenTemplate,
    },
  ],
};

registerIntegration(microsoftPlugin);

export default microsoftPlugin;
