"use client";

import {
  SiGmail,
  SiGooglecalendar,
  SiGoogledrive,
} from "@icons-pack/react-simple-icons";
import {
  CalendarClock,
  Check,
  Cloud,
  Mail,
  Share2,
  Trash2,
  Users2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { IntegrationIcon } from "@/components/ui/integration-icon";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  api,
  type CustomIntegrationField,
  type Integration,
  type IntegrationConfig,
  type IntegrationType,
  type IntegrationWithConfig,
} from "@/lib/api-client";

type IntegrationFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (integrationId: string) => void;
  integration?: Integration | IntegrationWithConfig | null;
  mode: "create" | "edit";
  preselectedType?: IntegrationType;
};

type IntegrationFormData = {
  name: string;
  type: IntegrationType;
  config: IntegrationConfig;
};

const INTEGRATION_TYPES: IntegrationType[] = [
  "ai-gateway",
  "database",
  "google",
  "microsoft",
  "linear",
  "resend",
  "slack",
  "firecrawl",
  "custom",
];

const INTEGRATION_LABELS: Record<IntegrationType, string> = {
  resend: "Resend",
  linear: "Linear",
  slack: "Slack",
  database: "Database",
  "ai-gateway": "AI Gateway",
  google: "Google Workspace",
  microsoft: "Microsoft 365",
  firecrawl: "Firecrawl",
  custom: "Custom",
};

const GOOGLE_SERVICE_OPTIONS = [
  { id: "gmail", label: "Gmail", Icon: SiGmail, color: "#EA4335" },
  { id: "drive", label: "Drive", Icon: SiGoogledrive, color: "#1A73E8" },
  {
    id: "calendar",
    label: "Calendar",
    Icon: SiGooglecalendar,
    color: "#188038",
  },
] as const;

const CREDENTIAL_SOURCE_OPTIONS = [
  { id: "user", label: "Use my own app credentials" },
  { id: "system", label: "Use platform-managed app" },
] as const;

const MICROSOFT_SERVICE_OPTIONS = [
  {
    id: "outlook",
    label: "Outlook",
    Icon: Mail,
    color: "#0F6CBD",
  },
  {
    id: "sharepoint",
    label: "SharePoint",
    Icon: Share2,
    color: "#037362",
  },
  {
    id: "onedrive",
    label: "OneDrive",
    Icon: Cloud,
    color: "#0364B8",
  },
  { id: "teams", label: "Teams", Icon: Users2, color: "#5B5FC7" },
  {
    id: "calendar",
    label: "Calendars",
    Icon: CalendarClock,
    color: "#0F6CBD",
  },
] as const;

const MICROSOFT_AUTH_MODES = [
  { id: "application", label: "Application (client credentials)" },
  { id: "delegated", label: "Delegated (refresh token)" },
] as const;

export function IntegrationFormDialog({
  open,
  onClose,
  onSuccess,
  integration,
  mode,
  preselectedType,
}: IntegrationFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [formData, setFormData] = useState<IntegrationFormData>({
    name: "",
    type: preselectedType || "resend",
    config: {},
  });

  useEffect(() => {
    let isMounted = true;

    if (!integration) {
      setFormData({
        name: "",
        type: preselectedType || "resend",
        config: {},
      });
      setLoadingConfig(false);
      return () => {
        isMounted = false;
      };
    }

    setLoadingConfig(true);

    const fetchIntegration =
      "config" in integration
        ? Promise.resolve(integration)
        : api.integration.get(integration.id);

    fetchIntegration
      .then((integrationWithConfig) => {
        if (!isMounted) {
          return;
        }
        setFormData({
          name: integrationWithConfig.name,
          type: integrationWithConfig.type,
          config: integrationWithConfig.config || {},
        });
      })
      .catch((error) => {
        console.error("Failed to load integration config:", error);
        if (isMounted) {
          toast.error("Failed to load integration details");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingConfig(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [integration, preselectedType]);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Generate a default name if none provided
      const integrationName =
        formData.name.trim() ||
        `${INTEGRATION_LABELS[formData.type]} Integration`;

      let normalizedConfig: IntegrationConfig;

      if (formData.type === "custom") {
        const cleanedFields =
          formData.config.customFields
            ?.map((field) => ({
              ...field,
              key: field.key?.trim() || "",
              value: field.value || "",
            }))
            .filter((field) => field.key.length > 0) || [];

        if (cleanedFields.length === 0) {
          toast.error("Add at least one secret for your custom integration");
          setSaving(false);
          return;
        }

        normalizedConfig = {
          ...formData.config,
          customFields: cleanedFields,
        };
      } else {
        const { customFields: _customFields, ...restConfig } = formData.config;
        normalizedConfig = restConfig;
      }

      if (mode === "edit" && integration) {
        await api.integration.update(integration.id, {
          name: integrationName,
          config: normalizedConfig,
        });
        toast.success("Integration updated");
        onSuccess?.(integration.id);
      } else {
        const newIntegration = await api.integration.create({
          name: integrationName,
          type: formData.type,
          config: normalizedConfig,
        });
        toast.success("Integration created");
        onSuccess?.(newIntegration.id);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save integration:", error);
      toast.error("Failed to save integration");
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: string, value: string) => {
    setFormData({
      ...formData,
      config: { ...formData.config, [key]: value },
    });
  };

  const updateCustomField = (
    index: number,
    field: keyof CustomIntegrationField,
    value: string
  ) => {
    const fields = formData.config.customFields || [];
    const nextFields = fields.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );

    setFormData({
      ...formData,
      config: { ...formData.config, customFields: nextFields },
    });
  };

  const addCustomField = () => {
    const fields = formData.config.customFields || [];

    setFormData({
      ...formData,
      config: {
        ...formData.config,
        customFields: [...fields, { key: "", value: "" }],
      },
    });
  };

  const isDisabled = saving || loadingConfig;

  const removeCustomField = (index: number) => {
    const fields = formData.config.customFields || [];

    setFormData({
      ...formData,
      config: {
        ...formData.config,
        customFields: fields.filter((_, i) => i !== index),
      },
    });
  };

  const toggleServiceSelection = (
    field: "googleServices" | "microsoftServices",
    service: string
  ) => {
    setFormData((previous) => {
      const currentServices =
        (previous.config[field] as string[] | undefined) || [];
      const nextServices = currentServices.includes(service)
        ? currentServices.filter((item) => item !== service)
        : [...currentServices, service];

      return {
        ...previous,
        config: { ...previous.config, [field]: nextServices },
      };
    });
  };

  const renderServiceOptions = (
    field: "googleServices" | "microsoftServices",
    options: typeof GOOGLE_SERVICE_OPTIONS | typeof MICROSOFT_SERVICE_OPTIONS
  ) => {
    const selected = (formData.config[field] as string[] | undefined) || [];

    return (
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const Icon = option.Icon;
          const isSelected = selected.includes(option.id);

          return (
            <Button
              aria-pressed={isSelected}
              className="flex items-center justify-between"
              disabled={isDisabled}
              key={option.id}
              onClick={() => toggleServiceSelection(field, option.id)}
              type="button"
              variant={isSelected ? "secondary" : "outline"}
            >
              <span className="flex items-center gap-2">
                <Icon className="size-4" color={option.color} />
                {option.label}
              </span>
              {isSelected ? <Check className="size-4" /> : null}
            </Button>
          );
        })}
      </div>
    );
  };

  const renderResendFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <Input
          id="apiKey"
          onChange={(e) => updateConfig("apiKey", e.target.value)}
          placeholder="re_..."
          type="password"
          value={formData.config.apiKey || ""}
        />
        <p className="text-muted-foreground text-xs">
          Get your API key from{" "}
          <a
            className="underline hover:text-foreground"
            href="https://resend.com/api-keys"
            rel="noopener noreferrer"
            target="_blank"
          >
            resend.com/api-keys
          </a>
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fromEmail">From Email</Label>
        <Input
          id="fromEmail"
          onChange={(e) => updateConfig("fromEmail", e.target.value)}
          placeholder="noreply@example.com"
          value={formData.config.fromEmail || ""}
        />
      </div>
    </>
  );

  const renderLinearFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <Input
          id="apiKey"
          onChange={(e) => updateConfig("apiKey", e.target.value)}
          placeholder="lin_api_..."
          type="password"
          value={formData.config.apiKey || ""}
        />
        <p className="text-muted-foreground text-xs">
          Get your API key from{" "}
          <a
            className="underline hover:text-foreground"
            href="https://linear.app/settings/account/security"
            rel="noopener noreferrer"
            target="_blank"
          >
            linear.app/settings/account/security
          </a>
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="teamId">Team ID</Label>
        <Input
          id="teamId"
          onChange={(e) => updateConfig("teamId", e.target.value)}
          placeholder="team_..."
          value={formData.config.teamId || ""}
        />
      </div>
    </>
  );

  const renderSlackFields = () => (
    <div className="space-y-2">
      <Label htmlFor="apiKey">Bot Token</Label>
      <Input
        id="apiKey"
        onChange={(e) => updateConfig("apiKey", e.target.value)}
        placeholder="xoxb-..."
        type="password"
        value={formData.config.apiKey || ""}
      />
      <p className="text-muted-foreground text-xs">
        Create a Slack app and get your bot token from{" "}
        <a
          className="underline hover:text-foreground"
          href="https://api.slack.com/apps"
          rel="noopener noreferrer"
          target="_blank"
        >
          api.slack.com/apps
        </a>
      </p>
    </div>
  );

  const renderDatabaseFields = () => (
    <div className="space-y-2">
      <Label htmlFor="url">Database URL</Label>
      <Input
        id="url"
        onChange={(e) => updateConfig("url", e.target.value)}
        placeholder="postgresql://..."
        type="password"
        value={formData.config.url || ""}
      />
      <p className="text-muted-foreground text-xs">
        Connection string in the format:
        postgresql://user:password@host:port/database
      </p>
    </div>
  );

  const renderAiGatewayFields = () => (
    <div className="space-y-2">
      <Label htmlFor="apiKey">AI Gateway API Key</Label>
      <Input
        id="apiKey"
        onChange={(e) => updateConfig("apiKey", e.target.value)}
        placeholder="API Key"
        type="password"
        value={formData.config.apiKey || ""}
      />
      <p className="text-muted-foreground text-xs">
        Get your API key from{" "}
        <a
          className="underline hover:text-foreground"
          href="https://vercel.com/ai-gateway"
          rel="noopener noreferrer"
          target="_blank"
        >
          vercel.com/ai-gateway
        </a>
      </p>
    </div>
  );

  const renderGoogleFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="googleCredentialSource">Credential Source</Label>
        <Select
          disabled={isDisabled}
          onValueChange={(value) =>
            setFormData((previous) => ({
              ...previous,
              config: {
                ...previous.config,
                googleCredentialSource: value as "user" | "system",
              },
            }))
          }
          value={formData.config.googleCredentialSource || "user"}
        >
          <SelectTrigger id="googleCredentialSource">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CREDENTIAL_SOURCE_OPTIONS.map((credential) => (
              <SelectItem key={credential.id} value={credential.id}>
                {credential.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          System-managed uses the platform OAuth app ID/secret; user-provided
          lets you bring your own.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="googleClientId">OAuth Client ID</Label>
          <Input
            disabled={
              (formData.config.googleCredentialSource || "user") === "system"
            }
            id="googleClientId"
            onChange={(e) => updateConfig("googleClientId", e.target.value)}
            placeholder="google client id"
            value={formData.config.googleClientId || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="googleClientSecret">OAuth Client Secret</Label>
          <Input
            disabled={
              (formData.config.googleCredentialSource || "user") === "system"
            }
            id="googleClientSecret"
            onChange={(e) => updateConfig("googleClientSecret", e.target.value)}
            placeholder="google client secret"
            type="password"
            value={formData.config.googleClientSecret || ""}
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="googleRefreshToken">Refresh Token</Label>
          <Input
            disabled={
              (formData.config.googleCredentialSource || "user") === "system"
            }
            id="googleRefreshToken"
            onChange={(e) => updateConfig("googleRefreshToken", e.target.value)}
            placeholder="1//04..."
            type="password"
            value={formData.config.googleRefreshToken || ""}
          />
          <p className="text-muted-foreground text-xs">
            Use an OAuth 2.0 refresh token that includes Gmail/Drive/Calendar
            scopes.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="googleRedirectUri">Redirect URI (optional)</Label>
          <Input
            id="googleRedirectUri"
            onChange={(e) => updateConfig("googleRedirectUri", e.target.value)}
            placeholder="https://yourapp.com/api/auth/callback"
            value={formData.config.googleRedirectUri || ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="googleScopes">Scopes</Label>
        <Textarea
          id="googleScopes"
          onChange={(e) => updateConfig("googleScopes", e.target.value)}
          placeholder="https://www.googleapis.com/auth/gmail.send, https://www.googleapis.com/auth/drive, https://www.googleapis.com/auth/calendar"
          value={formData.config.googleScopes || ""}
        />
        <p className="text-muted-foreground text-xs">
          Comma-separated list of Google scopes to support Gmail, Drive, and
          Calendar.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="googleServiceAccount">
          Service Account JSON (optional)
        </Label>
        <Textarea
          id="googleServiceAccount"
          onChange={(e) => updateConfig("googleServiceAccount", e.target.value)}
          placeholder='{"type":"service_account","project_id":"...","private_key_id":"..."}'
          rows={4}
          value={formData.config.googleServiceAccount || ""}
        />
        <p className="text-muted-foreground text-xs">
          Paste the full JSON if you use a Workspace service account with
          domain-wide delegation.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="googleWorkspaceAdminEmail">
          Workspace Admin Email (optional)
        </Label>
        <Input
          id="googleWorkspaceAdminEmail"
          onChange={(e) =>
            updateConfig("googleWorkspaceAdminEmail", e.target.value)
          }
          placeholder="admin@company.com"
          value={formData.config.googleWorkspaceAdminEmail || ""}
        />
      </div>
      <div className="space-y-2">
        <Label>Services</Label>
        <p className="text-muted-foreground text-xs">
          Select the Google surfaces you plan to access to align scopes and
          permission reviews.
        </p>
        {renderServiceOptions("googleServices", GOOGLE_SERVICE_OPTIONS)}
      </div>
    </div>
  );

  const renderMicrosoftFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="microsoftCredentialSource">Credential Source</Label>
        <Select
          disabled={isDisabled}
          onValueChange={(value) =>
            setFormData((previous) => ({
              ...previous,
              config: {
                ...previous.config,
                microsoftCredentialSource: value as "user" | "system",
              },
            }))
          }
          value={formData.config.microsoftCredentialSource || "user"}
        >
          <SelectTrigger id="microsoftCredentialSource">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CREDENTIAL_SOURCE_OPTIONS.map((credential) => (
              <SelectItem key={credential.id} value={credential.id}>
                {credential.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          System-managed uses the platform app ID/secret; user-provided lets you
          bring your own.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="microsoftAuthMode">Auth Mode</Label>
        <Select
          disabled={isDisabled}
          onValueChange={(value) =>
            setFormData((previous) => ({
              ...previous,
              config: {
                ...previous.config,
                microsoftAuthMode: value as "application" | "delegated",
                // Keep existing tokens/secrets but update scopes default per mode if empty
                microsoftScopes:
                  previous.config.microsoftScopes ||
                  (value === "application"
                    ? "https://graph.microsoft.com/.default"
                    : "offline_access https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Calendars.ReadWrite"),
              },
            }))
          }
          value={formData.config.microsoftAuthMode || "application"}
        >
          <SelectTrigger id="microsoftAuthMode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MICROSOFT_AUTH_MODES.map((authModeOption) => (
              <SelectItem key={authModeOption.id} value={authModeOption.id}>
                {authModeOption.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Application mode uses app-only permissions; Delegated expects a
          refresh token from an OAuth consent flow.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="microsoftTenantId">Tenant ID</Label>
          <Input
            id="microsoftTenantId"
            onChange={(e) => updateConfig("microsoftTenantId", e.target.value)}
            placeholder="contoso.onmicrosoft.com or GUID"
            value={formData.config.microsoftTenantId || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="microsoftAuthorityHost">Authority Host</Label>
          <Input
            id="microsoftAuthorityHost"
            onChange={(e) =>
              updateConfig("microsoftAuthorityHost", e.target.value)
            }
            placeholder="https://login.microsoftonline.com"
            value={formData.config.microsoftAuthorityHost || ""}
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="microsoftClientId">Client ID</Label>
          <Input
            disabled={
              (formData.config.microsoftCredentialSource || "user") === "system"
            }
            id="microsoftClientId"
            onChange={(e) => updateConfig("microsoftClientId", e.target.value)}
            placeholder="Application (client) ID"
            value={formData.config.microsoftClientId || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="microsoftClientSecret">Client Secret</Label>
          <Input
            disabled={
              (formData.config.microsoftCredentialSource || "user") === "system"
            }
            id="microsoftClientSecret"
            onChange={(e) =>
              updateConfig("microsoftClientSecret", e.target.value)
            }
            placeholder="Client secret"
            type="password"
            value={formData.config.microsoftClientSecret || ""}
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="microsoftRefreshToken">
            Refresh Token (delegated only)
          </Label>
          <Input
            disabled={
              (formData.config.microsoftAuthMode || "application") ===
              "application"
            }
            id="microsoftRefreshToken"
            onChange={(e) =>
              updateConfig("microsoftRefreshToken", e.target.value)
            }
            placeholder="0.AAA..."
            type="password"
            value={formData.config.microsoftRefreshToken || ""}
          />
          <p className="text-muted-foreground text-xs">
            Obtain via an OAuth authorization code flow with offline_access and
            Graph scopes.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="microsoftRedirectUri">Redirect URI</Label>
          <Input
            disabled={
              (formData.config.microsoftAuthMode || "application") ===
              "application"
            }
            id="microsoftRedirectUri"
            onChange={(e) =>
              updateConfig("microsoftRedirectUri", e.target.value)
            }
            placeholder="https://yourapp.com/api/auth/microsoft"
            value={formData.config.microsoftRedirectUri || ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="microsoftScopes">Scopes</Label>
        <Textarea
          id="microsoftScopes"
          onChange={(e) => updateConfig("microsoftScopes", e.target.value)}
          placeholder="https://graph.microsoft.com/.default"
          value={formData.config.microsoftScopes || ""}
        />
        <p className="text-muted-foreground text-xs">
          Include Graph scopes for Outlook, SharePoint, OneDrive, Teams, and
          Calendars. Use .default for application permissions or explicit scopes
          for delegated refresh tokens.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Services</Label>
        <p className="text-muted-foreground text-xs">
          Pick the Microsoft surfaces you need. We use this to highlight
          required scopes.
        </p>
        {renderServiceOptions("microsoftServices", MICROSOFT_SERVICE_OPTIONS)}
      </div>
    </div>
  );

  const renderFirecrawlFields = () => (
    <div className="space-y-2">
      <Label htmlFor="firecrawlApiKey">API Key</Label>
      <Input
        id="firecrawlApiKey"
        onChange={(e) => updateConfig("firecrawlApiKey", e.target.value)}
        placeholder="fc-..."
        type="password"
        value={formData.config.firecrawlApiKey || ""}
      />
      <p className="text-muted-foreground text-xs">
        Get your API key from{" "}
        <a
          className="underline hover:text-foreground"
          href="https://firecrawl.dev/app/api-keys"
          rel="noopener noreferrer"
          target="_blank"
        >
          firecrawl.dev
        </a>
      </p>
    </div>
  );

  const renderCustomFields = () => {
    const customFields = formData.config.customFields || [
      { key: "", value: "" },
    ];

    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Secrets</Label>
          <p className="text-muted-foreground text-xs">
            Store key/value pairs for your custom integration. Values are
            encrypted and available to your workflows at runtime.
          </p>
        </div>

        {customFields.map((field, index) => (
          <div
            className="flex items-center gap-2"
            key={`${index}-${field.key}`}
          >
            <Input
              autoFocus={index === customFields.length - 1}
              onChange={(e) => updateCustomField(index, "key", e.target.value)}
              placeholder="API_KEY"
              value={field.key || ""}
            />
            <Input
              onChange={(e) =>
                updateCustomField(index, "value", e.target.value)
              }
              placeholder="Value"
              type="password"
              value={field.value || ""}
            />
            <Button
              className="shrink-0"
              disabled={customFields.length === 1}
              onClick={() => removeCustomField(index)}
              size="icon"
              variant="ghost"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}

        <Button onClick={addCustomField} size="sm" variant="outline">
          Add secret
        </Button>
      </div>
    );
  };

  const renderConfigFields = () => {
    if (loadingConfig) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Spinner className="size-4" />
          <span>Loading integration...</span>
        </div>
      );
    }

    switch (formData.type) {
      case "resend":
        return renderResendFields();
      case "linear":
        return renderLinearFields();
      case "slack":
        return renderSlackFields();
      case "database":
        return renderDatabaseFields();
      case "ai-gateway":
        return renderAiGatewayFields();
      case "google":
        return renderGoogleFields();
      case "microsoft":
        return renderMicrosoftFields();
      case "firecrawl":
        return renderFirecrawlFields();
      case "custom":
        return renderCustomFields();
      default:
        return null;
    }
  };

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && onClose()} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Integration" : "Add Integration"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update integration configuration"
              : "Configure a new integration"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                disabled={!!preselectedType || isDisabled}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    type: value as IntegrationType,
                    config: {},
                  })
                }
                value={formData.type}
              >
                <SelectTrigger className="w-full" id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTEGRATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <IntegrationIcon
                          className="size-4"
                          integration={type === "ai-gateway" ? "vercel" : type}
                        />
                        {INTEGRATION_LABELS[type]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {renderConfigFields()}

          <div className="space-y-2">
            <Label htmlFor="name">Name (Optional)</Label>
            <Input
              id="name"
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={`${INTEGRATION_LABELS[formData.type]} Integration`}
              value={formData.name}
            />
          </div>
        </div>

        <DialogFooter>
          <Button disabled={saving} onClick={() => onClose()} variant="outline">
            Cancel
          </Button>
          <Button disabled={isDisabled} onClick={handleSave}>
            {saving ? <Spinner className="mr-2 size-4" /> : null}
            {mode === "edit" ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
