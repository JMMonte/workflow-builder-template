"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type { Team } from "@/lib/api-client";

import { TeamBrandingFields } from "./team-branding-fields";

type TeamSettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTeam: Team | null;
  renameDraft: string;
  onRenameChange: (value: string) => void;
  saving: boolean;
  onSave: () => void;
  deleting: boolean;
  onDelete: () => void;
  icon: string;
  onIconChange: (value: string) => void;
  iconColor: string;
  onIconColorChange: (value: string) => void;
  imageUrl: string;
  onImageUrlChange: (value: string) => void;
};

export function TeamSettingsModal({
  open,
  onOpenChange,
  activeTeam,
  renameDraft,
  onRenameChange,
  saving,
  onSave,
  deleting,
  onDelete,
  icon,
  onIconChange,
  iconColor,
  onIconColorChange,
  imageUrl,
  onImageUrlChange,
}: TeamSettingsModalProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const canManageTeam = activeTeam?.role === "owner";

  if (!(activeTeam && canManageTeam)) {
    return null;
  }

  const trimmedName = renameDraft.trim();
  const normalize = (value?: string | null) => value?.trim() || "";
  const hasChanges =
    trimmedName.length > 0 &&
    (trimmedName !== activeTeam.name ||
      normalize(icon) !== normalize(activeTeam.icon) ||
      normalize(iconColor) !== normalize(activeTeam.iconColor) ||
      normalize(imageUrl) !== normalize(activeTeam.imageUrl));

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Team settings</DialogTitle>
            <DialogDescription>
              Manage settings for {activeTeam.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-rename">Team name</Label>
              <Input
                id="team-rename"
                onChange={(e) => onRenameChange(e.target.value)}
                placeholder="Team name"
                value={renameDraft}
              />
            </div>
            <TeamBrandingFields
              colorInputId="team-icon-color"
              disabled={saving || deleting}
              icon={icon}
              iconColor={iconColor}
              iconInputId="team-icon"
              imageInputId="team-image"
              imageUrl={imageUrl}
              name={renameDraft || activeTeam.name}
              onIconChange={onIconChange}
              onIconColorChange={onIconColorChange}
              onImageUrlChange={onImageUrlChange}
            />
          </div>
          <Separator />
          <DialogFooter className="flex-row justify-end">
            <Button
              disabled={deleting || saving}
              onClick={() => setDeleteDialogOpen(true)}
              variant="destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete team
            </Button>
            <Button
              disabled={saving || deleting || !hasChanges}
              onClick={onSave}
            >
              {saving ? <Spinner className="mr-2 size-4" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this team?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the team and revoke member access. Workflows or
              integrations should be moved or deleted first. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={() => {
                setDeleteDialogOpen(false);
                onOpenChange(false);
                onDelete();
              }}
            >
              {deleting ? <Spinner className="mr-2 size-4" /> : null}
              Delete team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
