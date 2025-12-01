import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Forgot password | Darkmatter Agents",
  description: "Options to regain access to your Darkmatter Agents account.",
};

const recoverySteps = [
  "Sign in with the social provider you originally used (Google, GitHub, or Vercel) to bypass a password reset.",
  "If you registered with email and password, contact your workspace admin to trigger a reset from the authentication provider.",
  "If this is your own deployment, configure password reset emails in Better Auth (emailAndPassword.sendResetPassword) and try again.",
];

export default function ForgotPasswordPage() {
  return (
    <div className="bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-16">
        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-3">
            <CardTitle className="text-3xl tracking-tight">
              Forgot your password?
            </CardTitle>
            <CardDescription>
              Password reset emails are not configured on this deployment yet.
              Use the steps below to regain access or reach out for help.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h2 className="font-semibold text-lg">What to try</h2>
              <ul className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                {recoverySteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
            <Separator />
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild>
                <Link href="/login">Back to login</Link>
              </Button>
              <Link
                className="text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
                href="/privacy"
              >
                Review how we handle your data
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
