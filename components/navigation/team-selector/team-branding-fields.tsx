"use client";

import { Button } from "@/components/ui/button";
import { IconGrid } from "@/components/ui/icon-grid";
import { DEFAULT_ICON_COLOR, ICON_OPTIONS } from "@/components/ui/icon-options";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TeamAvatar } from "./team-avatar";

type TeamBrandingFieldsProps = {
  colorInputId: string;
  disabled?: boolean;
  icon: string;
  iconColor: string;
  iconInputId: string;
  imageInputId: string;
  imageUrl: string;
  name: string;
  onIconChange: (value: string) => void;
  onIconColorChange: (value: string) => void;
  onImageUrlChange: (value: string) => void;
};

export function TeamBrandingFields({
  colorInputId,
  disabled,
  icon,
  iconColor,
  iconInputId,
  imageInputId,
  imageUrl,
  name,
  onIconChange,
  onIconColorChange,
  onImageUrlChange,
}: TeamBrandingFieldsProps) {
  const previewTeam = {
    name: name || "Team",
    icon,
    iconColor,
    imageUrl,
  };
  const resolvedIconColor = icon
    ? iconColor || DEFAULT_ICON_COLOR
    : DEFAULT_ICON_COLOR;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={imageInputId}>Team image</Label>
        <div className="flex items-center gap-3">
          <TeamAvatar size="lg" team={previewTeam} />
          <div className="flex-1 space-y-2">
            <Input
              autoComplete="url"
              disabled={disabled}
              id={imageInputId}
              onChange={(e) => onImageUrlChange(e.target.value)}
              placeholder="https://example.com/team-logo.png"
              type="url"
              value={imageUrl}
            />
            <p className="text-muted-foreground text-xs">
              Add a public image URL for your team. Leave empty to use an icon.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr,auto] sm:items-start">
        <div className="space-y-2">
          <Label htmlFor={iconInputId}>Team icon</Label>
          <IconGrid
            color={resolvedIconColor}
            disabled={disabled}
            id={iconInputId}
            onChange={onIconChange}
            options={ICON_OPTIONS}
            value={icon || null}
          />
          <div className="flex gap-2">
            <Button
              disabled={disabled}
              onClick={() => {
                onIconChange("");
                onIconColorChange("");
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              Use initials
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={colorInputId}>Icon color</Label>
          <div className="flex items-center gap-2">
            <Input
              className="h-10 w-16 p-1"
              disabled={disabled || !icon}
              id={colorInputId}
              onChange={(e) => onIconColorChange(e.target.value)}
              type="color"
              value={resolvedIconColor}
            />
            <Button
              disabled={disabled || !icon}
              onClick={() => onIconColorChange("")}
              size="sm"
              type="button"
              variant="ghost"
            >
              Reset
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Icon color applies when no image is set.
          </p>
        </div>
      </div>
    </div>
  );
}
