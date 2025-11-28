import type { ReactNode } from "react";
import { AppShell } from "@/components/navigation/app-shell";

type DashboardLayoutProps = {
  children: ReactNode;
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => (
  <AppShell>{children}</AppShell>
);

export default DashboardLayout;
