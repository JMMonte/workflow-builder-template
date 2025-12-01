import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ReactFlowProvider } from "@xyflow/react";
import { Provider } from "jotai";
import type { ReactNode } from "react";
import { LoginGate } from "@/components/auth/login-gate";
import { AuthProvider } from "@/components/auth/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { PersistentCanvas } from "@/components/workflow/persistent-canvas";
import { mono, sans } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Darkmatter Agents | AI Workflow Automations for Teams",
  description:
    "Darkmatter Agents is an app for managing AI workflow automations for teams with a collaborative visual builder.",
  icons: {
    icon: [
      { url: "/favicon.png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en" suppressHydrationWarning>
    <body className={cn(sans.variable, mono.variable, "antialiased")}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableSystem
      >
        <Provider>
          <AuthProvider>
            <ReactFlowProvider>
              <PersistentCanvas />
              <LoginGate />
              <div className="relative z-10">{children}</div>
            </ReactFlowProvider>
            <Toaster />
          </AuthProvider>
        </Provider>
      </ThemeProvider>
      <Analytics />
      <SpeedInsights />
    </body>
  </html>
);

export default RootLayout;
