"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ApiError, api, type GatewayModel } from "@/lib/api-client";

type ModelOption = {
  value: string;
  label: string;
  helper?: string;
};

function getModelErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "Add an AI Gateway integration to load models";
  }
  return "Unable to load models from AI Gateway";
}

type AiGatewayModelSelectProps = {
  integrationId?: string;
  modelType?: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  selectId?: string;
};

function toOptions(models: GatewayModel[], modelType?: string): ModelOption[] {
  return models
    .filter((model) => {
      if (!modelType) {
        return true;
      }
      return (
        model.modelType === modelType ||
        model.modelType === undefined ||
        model.modelType === null
      );
    })
    .map((model) => ({
      value: model.id,
      label: model.name || model.id,
      helper:
        model.name && model.name !== model.id ? model.id : model.description,
    }));
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Component centralizes async fetch, filtering, and selection display.
export function AiGatewayModelSelect({
  integrationId,
  modelType,
  value,
  onChange,
  disabled,
  placeholder = "Select model",
  selectId,
}: AiGatewayModelSelectProps) {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchModels = async () => {
      setLoading(true);
      setError(null);
      setSearchTerm("");

      try {
        const response = await api.ai.getAvailableModels(integrationId);

        if (!isMounted) {
          return;
        }

        const options = toOptions(response.models || [], modelType);
        setModels(options);
      } catch (err) {
        console.error("Failed to fetch AI Gateway models:", err);
        if (isMounted) {
          setModels([]);
          setError(getModelErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchModels();

    return () => {
      isMounted = false;
    };
  }, [integrationId, modelType]);

  const options = useMemo(() => {
    const unique = new Map<string, ModelOption>();
    for (const option of models) {
      if (!unique.has(option.value)) {
        unique.set(option.value, option);
      }
    }
    if (value && !unique.has(value)) {
      unique.set(value, { value, label: value });
    }
    return Array.from(unique.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [models, value]);

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return options;
    }

    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        option.value.toLowerCase().includes(term) ||
        option.helper?.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  const selectedOption =
    options.find((option) => option.value === value) ||
    (value ? { value, label: value } : null);

  const displayedOptions = useMemo(() => {
    const list = [...filteredOptions];

    if (selectedOption && !list.some((option) => option.value === value)) {
      list.unshift(selectedOption);
    }

    return list;
  }, [filteredOptions, selectedOption, value]);

  const hasOptions = options.length > 0;

  useEffect(() => {
    if (open) {
      searchInputRef.current?.focus();
    }
  }, [open]);

  return (
    <Select
      disabled={disabled || (!hasOptions && loading)}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setSearchTerm("");
        }
      }}
      onValueChange={onChange}
      open={open}
      value={value || ""}
    >
      <SelectTrigger
        className="h-auto min-h-12 w-full items-start py-2"
        id={selectId}
      >
        <div className="flex flex-col items-start text-left">
          {selectedOption ? (
            <>
              <span className="font-medium text-sm leading-tight">
                {selectedOption.label}
              </span>
              {selectedOption.helper ? (
                <span className="text-muted-foreground text-xs leading-tight">
                  {selectedOption.helper}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-muted-foreground text-sm">
              {loading ? "Loading models..." : placeholder}
            </span>
          )}
        </div>
      </SelectTrigger>
      <SelectContent className="p-0 [&_[data-slot=select-scroll-down-button]]:hidden [&_[data-slot=select-scroll-up-button]]:hidden">
        <div className="sticky top-0 z-10 border-b bg-popover p-2">
          <Input
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            placeholder="Search models..."
            ref={searchInputRef}
            value={searchTerm}
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-1">
          {loading ? (
            <SelectItem disabled value="__loading">
              Loading models...
            </SelectItem>
          ) : null}

          {error ? (
            <SelectItem disabled value="__error">
              {error}
            </SelectItem>
          ) : null}

          {!loading && displayedOptions.length === 0 ? (
            <SelectItem disabled value="__no_models">
              {searchTerm
                ? "No models match your search"
                : "No models available"}
            </SelectItem>
          ) : null}

          {displayedOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex flex-col gap-0.5">
                <span>{option.label}</span>
                {option.helper ? (
                  <span className="text-muted-foreground text-xs">
                    {option.helper}
                  </span>
                ) : null}
              </div>
            </SelectItem>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
}
