"use client";

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
import { Spinner } from "@/components/ui/spinner";

import { TeamBrandingFields } from "./team-branding-fields";

type CreateTeamDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newTeamName: string;
  newTeamIcon: string;
  newTeamIconColor: string;
  newTeamImageUrl: string;
  onNameChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onIconColorChange: (value: string) => void;
  onImageUrlChange: (value: string) => void;
  creating: boolean;
  onCreate: () => void;
  inputId: string;
};

export function CreateTeamDialog({
  open,
  onOpenChange,
  newTeamName,
  newTeamIcon,
  newTeamIconColor,
  newTeamImageUrl,
  onNameChange,
  onIconChange,
  onIconColorChange,
  onImageUrlChange,
  creating,
  onCreate,
  inputId,
}: CreateTeamDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create team</DialogTitle>
          <DialogDescription>
            Create a new team for your workflows and integrations.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={inputId}>Team name</Label>
            <Input
              id={inputId}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Marketing team"
              value={newTeamName}
            />
          </div>
          <TeamBrandingFields
            colorInputId={`${inputId}-icon-color`}
            disabled={creating}
            icon={newTeamIcon}
            iconColor={newTeamIconColor}
            iconInputId={`${inputId}-icon`}
            imageInputId={`${inputId}-image`}
            imageUrl={newTeamImageUrl}
            name={newTeamName}
            onIconChange={onIconChange}
            onIconColorChange={onIconColorChange}
            onImageUrlChange={onImageUrlChange}
          />
        </div>
        <DialogFooter>
          <Button disabled={creating || !newTeamName.trim()} onClick={onCreate}>
            {creating ? <Spinner className="mr-2 size-4" /> : null}
            Create team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
