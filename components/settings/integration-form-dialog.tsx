"use client";

import { Trash2 } from "lucide-react";
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
  firecrawl: "Firecrawl",
  custom: "Custom",
};

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
        return (
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
      case "linear":
        return (
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
      case "slack":
        return (
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
      case "database":
        return (
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
      case "ai-gateway":
        return (
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
      case "firecrawl":
        return (
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
      case "custom": {
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
                  onChange={(e) =>
                    updateCustomField(index, "key", e.target.value)
                  }
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
      }
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
