ALTER TABLE "workflows" ADD COLUMN "icon" text DEFAULT 'workflow' NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "icon_color" text DEFAULT '#2563eb' NOT NULL;