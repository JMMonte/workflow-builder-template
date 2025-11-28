import {
  DEFAULT_ICON_COLOR,
  getIconColors,
  getIconOption,
  ICON_OPTIONS,
  type IconOption,
} from "@/components/ui/icon-options";
import { DEFAULT_WORKFLOW_ICON_COLOR } from "@/lib/workflow-defaults";

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

export type WorkflowIconOption = IconOption;

export const WORKFLOW_ICON_OPTIONS = ICON_OPTIONS;

export function getWorkflowIconOption(value?: string): WorkflowIconOption {
  return getIconOption(value, "workflow");
}

export function getWorkflowIconColors(color?: string) {
  const fallbackColor =
    color ?? DEFAULT_WORKFLOW_ICON_COLOR ?? DEFAULT_ICON_COLOR;
  return getIconColors(fallbackColor);
}
