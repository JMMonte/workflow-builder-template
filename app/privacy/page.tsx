import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Privacy | Darkmatter Agents",
  description: "How Darkmatter Agents handles, stores, and shares your data.",
};

const privacySections = [
  {
    title: "What we collect",
    points: [
      "Account details (name, email), workflow definitions, execution metadata, and activity needed to secure the platform.",
      "Integration credentials you connect are encrypted at rest; access is limited to the operations required for workflow execution.",
    ],
  },
  {
    title: "How we use data",
    points: [
      "Operate the product, improve reliability, and troubleshoot workflow runs.",
      "Send essential product communications; we do not sell customer data.",
    ],
  },
  {
    title: "Third-party services",
    points: [
      "Data sent to integrations (e.g., email, issue trackers, storage) is governed by those providers' terms.",
      "AI requests use your configured provider; logs are limited to inputs/outputs necessary for debugging.",
    ],
  },
  {
    title: "Your controls",
    points: [
      "You can remove integrations or delete workflows; contact us to request account deletion.",
      "Reach out if you need a data export for compliance or audits.",
    ],
  },
];

const LAST_UPDATED = "Mar 1, 2025";

export default function PrivacyPage() {
  return (
    <div className="bg-linear-to-b from-background via-background to-muted/30">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16">
        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-3">
            <CardTitle className="text-3xl tracking-tight">
              Privacy Policy
            </CardTitle>
            <CardDescription>
              A concise overview of how Darkmatter Agents handles your
              information. For deeper compliance needs, contact the team that
              manages this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {privacySections.map((section, index) => (
              <div className="space-y-3" key={section.title}>
                <div>
                  <h2 className="font-semibold text-xl">{section.title}</h2>
                  <p className="text-muted-foreground text-sm">
                    {section.points.length} things to know
                  </p>
                </div>
                <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                {index < privacySections.length - 1 && <Separator />}
              </div>
            ))}
            <p className="text-muted-foreground text-xs">
              Last updated: {LAST_UPDATED}.
            </p>
            <div className="flex items-center justify-end text-sm">
              <Link
                className="text-primary underline-offset-4 hover:underline"
                href="/terms"
              >
                View our Terms of Service
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
