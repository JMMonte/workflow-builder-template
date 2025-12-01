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
  title: "Terms | Flowzipper",
  description: "Terms of service for using the Flowzipper platform.",
};

const termsSections = [
  {
    title: "Accounts and access",
    points: [
      "Use accurate information when creating an account and keep credentials secure.",
      "You are responsible for activity under your account; let us know if you suspect unauthorized use.",
    ],
  },
  {
    title: "Acceptable use",
    points: [
      "Do not attempt to disrupt the service, bypass security, or abuse rate limits.",
      "Only run workflows you have permission to execute and follow the acceptable use policies of connected providers.",
    ],
  },
  {
    title: "Data handling",
    points: [
      "We store workflows, execution metadata, and logs to operate and troubleshoot the product.",
      "Data sent to third-party integrations is subject to their terms; avoid sending sensitive data unless required.",
    ],
  },
  {
    title: "Service changes",
    points: [
      "Features may change or be discontinued as the product evolves.",
      "The service is provided as-is without guarantees of availability; we will communicate material changes when possible.",
    ],
  },
];

const LAST_UPDATED = "Mar 1, 2025";

export default function TermsPage() {
  return (
    <div className="bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16">
        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-3">
            <CardTitle className="text-3xl tracking-tight">
              Terms of Service
            </CardTitle>
            <CardDescription>
              The summary below explains how Flowzipper is intended to be used.
              If you have questions, reach out before operating production
              workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {termsSections.map((section, index) => (
              <div className="space-y-3" key={section.title}>
                <div>
                  <h2 className="font-semibold text-xl">{section.title}</h2>
                  <p className="text-muted-foreground text-sm">
                    {section.points.length} key guidelines
                  </p>
                </div>
                <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                {index < termsSections.length - 1 && <Separator />}
              </div>
            ))}
            <p className="text-muted-foreground text-xs">
              Last updated: {LAST_UPDATED}.
            </p>
            <div className="flex items-center justify-end text-sm">
              <Link
                className="text-primary underline-offset-4 hover:underline"
                href="/privacy"
              >
                Read our Privacy Policy
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
