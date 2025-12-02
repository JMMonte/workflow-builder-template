import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GoogleSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Workspace</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          Configure Google credentials in the Integrations dialog. You can use
          either the platform-managed OAuth app or bring your own Client ID and
          Secret.
        </p>
        <p>
          Supported surfaces: Gmail, Drive, and Calendar. Scopes should match
          the services you plan to call.
        </p>
      </CardContent>
    </Card>
  );
}
