import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MicrosoftSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Microsoft 365</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          Configure Microsoft credentials in the Integrations dialog. Use
          application (client credentials) or delegated (refresh token) modes.
        </p>
        <p>
          Supported surfaces: Outlook, Teams, OneDrive, SharePoint, and
          Calendar. Scopes should cover the services you plan to call.
        </p>
      </CardContent>
    </Card>
  );
}
