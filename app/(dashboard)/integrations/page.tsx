"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { IntegrationsManager } from "@/components/settings/integrations-manager";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";

export default function IntegrationsPage() {
  const { isPending, data: session } = useSession();
  const [showCreate, setShowCreate] = useState(false);

  if (isPending) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl">Integrations</h1>
          <p className="text-muted-foreground text-sm">
            Connect your tools to power workflows for this team.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="mr-2 size-4" />
          Add integration
        </Button>
      </div>
      <IntegrationsManager
        onShowCreateDialogChange={setShowCreate}
        showCreateDialog={showCreate}
      />
    </div>
  );
}
