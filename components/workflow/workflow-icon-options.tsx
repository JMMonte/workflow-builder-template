import {
  Activity,
  Bot,
  Cloud,
  Database,
  Globe2,
  Layers,
  Rocket,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";
import { DEFAULT_WORKFLOW_ICON_COLOR } from "@/lib/workflow-defaults";
import { WorkflowIcon } from "../ui/workflow-icon";

type IconProps = { className?: string; color?: string };

export type WorkflowIconOption = {
  value: string;
  label: string;
  Icon: ComponentType<IconProps>;
};

export const WORKFLOW_ICON_OPTIONS: WorkflowIconOption[] = [
  { value: "workflow", label: "Flow", Icon: WorkflowIcon },
  { value: "sparkles", label: "AI", Icon: Sparkles },
  { value: "zap", label: "Fast", Icon: Zap },
  { value: "bot", label: "Ops", Icon: Bot },
  { value: "database", label: "Data", Icon: Database },
  { value: "rocket", label: "Launch", Icon: Rocket },
  { value: "activity", label: "Monitoring", Icon: Activity },
  { value: "cloud", label: "Cloud", Icon: Cloud },
  { value: "layers", label: "Stack", Icon: Layers },
  { value: "globe-2", label: "Global", Icon: Globe2 },
  { value: "shield-check", label: "Secure", Icon: ShieldCheck },
];

export function getWorkflowIconOption(value?: string): WorkflowIconOption {
  return (
    WORKFLOW_ICON_OPTIONS.find((option) => option.value === value) ||
    WORKFLOW_ICON_OPTIONS[0]
  );
}

const HEX_REGEX = /^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/;

function normalizeColor(color?: string): string {
  if (!color?.trim()) {
    return DEFAULT_WORKFLOW_ICON_COLOR;
  }
  return color.trim();
}

function colorWithAlpha(color: string, alpha = 0.12): string | undefined {
  const match = color.match(HEX_REGEX);
  if (!match) {
    return;
  }

  let hex = match[1];
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const int = Number.parseInt(hex, 16);
  const r = Math.floor(int / 65_536) % 256;
  const g = Math.floor(int / 256) % 256;
  const b = int % 256;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getWorkflowIconColors(color?: string) {
  const normalized = normalizeColor(color);
  return {
    color: normalized,
    backgroundColor:
      colorWithAlpha(normalized) ??
      (normalized.startsWith("var(")
        ? "color-mix(in srgb, currentColor 12%, transparent)"
        : "rgba(0, 0, 0, 0.05)"),
  };
}

export function WorkflowIconDisplay({
  value,
  color,
  className,
}: {
  value?: string;
  color?: string;
  className?: string;
}) {
  const option = getWorkflowIconOption(value);
  const IconComponent = option.Icon;
  const { color: resolvedColor } = getWorkflowIconColors(color);

  return <IconComponent className={className} color={resolvedColor} />;
}
