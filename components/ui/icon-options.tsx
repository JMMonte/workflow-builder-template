import {
  Activity,
  Bot,
  Briefcase,
  Building2,
  Cloud,
  Database,
  Globe2,
  Layers,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { type ComponentType } from "react";

import { WorkflowIcon } from "./workflow-icon";

type IconProps = { className?: string; color?: string };

export type IconOption = {
  value: string;
  label: string;
  Icon: ComponentType<IconProps>;
};

export const DEFAULT_ICON_COLOR = "#2563eb";

export const ICON_OPTIONS: IconOption[] = [
  { value: "workflow", label: "Flow", Icon: WorkflowIcon },
  { value: "users", label: "Team", Icon: Users },
  { value: "building-2", label: "Workspace", Icon: Building2 },
  { value: "briefcase", label: "Operations", Icon: Briefcase },
  { value: "sparkles", label: "AI", Icon: Sparkles },
  { value: "zap", label: "Fast", Icon: Zap },
  { value: "bot", label: "Automation", Icon: Bot },
  { value: "database", label: "Data", Icon: Database },
  { value: "rocket", label: "Launch", Icon: Rocket },
  { value: "activity", label: "Monitoring", Icon: Activity },
  { value: "cloud", label: "Cloud", Icon: Cloud },
  { value: "layers", label: "Stack", Icon: Layers },
  { value: "globe-2", label: "Global", Icon: Globe2 },
  { value: "shield-check", label: "Security", Icon: ShieldCheck },
];

export function getIconOption(
  value?: string | null,
  fallbackValue?: string
): IconOption {
  const fallback =
    ICON_OPTIONS.find((option) => option.value === fallbackValue) ||
    ICON_OPTIONS[0];

  return (
    ICON_OPTIONS.find((option) => option.value === value) ||
    fallback ||
    ICON_OPTIONS[0]
  );
}

const HEX_REGEX = /^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/;

function colorWithAlpha(hex: string, alpha = 0.12) {
  const normalized = hex.replace("#", "");
  const int = Number.parseInt(normalized, 16);
  const r = Math.floor(int / 65_536) % 256;
  const g = Math.floor(int / 256) % 256;
  const b = int % 256;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolveBackgroundColor(color: string) {
  const match = color.match(HEX_REGEX);
  if (!match) {
    if (color.startsWith("var(")) {
      return "color-mix(in srgb, currentColor 12%, transparent)";
    }

    return "rgba(0, 0, 0, 0.05)";
  }

  const expandedHex =
    match[1].length === 3
      ? match[1]
          .split("")
          .map((char) => char + char)
          .join("")
      : match[1];

  return colorWithAlpha(`#${expandedHex}`);
}

export function getIconColors(color?: string | null) {
  const normalized = color?.trim() || DEFAULT_ICON_COLOR;

  return {
    color: normalized,
    backgroundColor: resolveBackgroundColor(normalized),
  };
}
