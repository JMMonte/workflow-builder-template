"use client";

import {
  Menu,
  PanelLeftOpen,
  PanelRightOpen,
  Plug,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkflowIcon } from "@/components/ui/workflow-icon";
import { UserMenu } from "@/components/workflows/user-menu";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  description: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Workflows",
    description: "Review and open team workflows.",
    href: "/workflows",
    icon: WorkflowIcon,
  },
  {
    label: "Integrations",
    description: "Connect services and data sources.",
    href: "/integrations",
    icon: Plug,
  },
  {
    label: "Team",
    description: "Manage members and permissions.",
    href: "/team",
    icon: UsersRound,
  },
];

type NavLinksProps = {
  activePath: string;
  collapsed?: boolean;
  onNavigate?: () => void;
};

function NavLinks({ activePath, collapsed, onNavigate }: NavLinksProps) {
  return (
    <div className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          activePath === item.href || activePath.startsWith(`${item.href}/`);
        const Icon = item.icon;

        const linkContent = (
          <Link
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2 font-medium text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed ? "justify-center px-2" : "justify-start",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/80"
            )}
            href={item.href}
            onClick={onNavigate}
          >
            <Icon className="size-4 shrink-0" />
            {collapsed ? null : <span>{item.label}</span>}
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip delayDuration={0} key={item.href}>
              <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        }

        return (
          <div className="relative" key={item.href}>
            {linkContent}
          </div>
        );
      })}
    </div>
  );
}

type AppShellProps = {
  children: ReactNode;
};

type UserIdentityProps = {
  userEmail?: string;
  userName?: string;
};

function UserIdentity({ userEmail, userName }: UserIdentityProps) {
  if (!(userEmail || userName)) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-col">
      {userName ? (
        <span className="truncate font-medium text-sm">{userName}</span>
      ) : null}
      {userEmail ? (
        <span className="truncate text-muted-foreground text-xs">
          {userEmail}
        </span>
      ) : null}
    </div>
  );
}

type SidebarUserSectionProps = UserIdentityProps & {
  collapsed: boolean;
  hasUserDetails: boolean;
};

function SidebarUserSection({
  collapsed,
  hasUserDetails,
  userEmail,
  userName,
}: SidebarUserSectionProps) {
  let alignment = "justify-end";

  if (collapsed) {
    alignment = "justify-center";
  } else if (hasUserDetails) {
    alignment = "justify-between";
  }

  return (
    <div className="mt-auto px-3 pb-4">
      <Separator className="mb-3" />
      <div className={cn("flex items-center gap-3", alignment)}>
        {collapsed ? null : (
          <UserIdentity userEmail={userEmail} userName={userName} />
        )}
        <UserMenu />
      </div>
    </div>
  );
}

type MobileUserSectionProps = UserIdentityProps & {
  hasUserDetails: boolean;
};

function MobileUserSection({
  hasUserDetails,
  userEmail,
  userName,
}: MobileUserSectionProps) {
  const alignment = hasUserDetails ? "justify-between" : "justify-end";

  return (
    <div className="border-t px-4 py-4">
      <div className={cn("flex items-center gap-3", alignment)}>
        {hasUserDetails ? (
          <UserIdentity userEmail={userEmail} userName={userName} />
        ) : null}
        <UserMenu />
      </div>
    </div>
  );
}

type DesktopSidebarProps = SidebarUserSectionProps & {
  isWorkflowDetail: boolean;
  onToggleCollapse: () => void;
  pathname: string;
};

function DesktopSidebar({
  collapsed,
  hasUserDetails,
  isWorkflowDetail,
  onToggleCollapse,
  pathname,
  userEmail,
  userName,
}: DesktopSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden h-screen border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
        collapsed ? "w-[76px]" : "w-64",
        isWorkflowDetail && "pointer-events-auto"
      )}
      data-sidebar="desktop"
    >
      <div className="flex w-full flex-col">
        <div className="flex items-center gap-2 px-3 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <WorkflowIcon className="size-5" />
          </div>
          {collapsed ? null : (
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight">
                Workflow Builder
              </span>
              <span className="text-muted-foreground text-xs leading-tight">
                Team workspace
              </span>
            </div>
          )}
        </div>
        <div className="px-2 py-2">
          <NavLinks activePath={pathname} collapsed={collapsed} />
        </div>
        <SidebarUserSection
          collapsed={collapsed}
          hasUserDetails={hasUserDetails}
          userEmail={userEmail}
          userName={userName}
        />
      </div>
      <button
        className="group absolute top-16 right-0 z-30 hidden h-10 w-4 translate-x-1/2 items-center justify-center rounded-r-md border border-l-0 bg-background/90 text-sidebar-foreground shadow-sm ring-1 ring-border transition hover:bg-muted md:flex"
        onClick={onToggleCollapse}
        type="button"
      >
        {collapsed ? (
          <PanelRightOpen className="size-3" />
        ) : (
          <PanelLeftOpen className="size-3" />
        )}
        <span className="sr-only">Toggle sidebar</span>
      </button>
    </aside>
  );
}

type MobileNavigationProps = MobileUserSectionProps & {
  mobileOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
};

function MobileNavigation({
  hasUserDetails,
  mobileOpen,
  onOpenChange,
  pathname,
  userEmail,
  userName,
}: MobileNavigationProps) {
  return (
    <Sheet onOpenChange={onOpenChange} open={mobileOpen}>
      <SheetContent className="w-80 border-r p-0" side="left">
        <div className="flex h-full flex-col">
          <div className="border-b px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <WorkflowIcon className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm leading-tight">
                  Workflow Builder
                </span>
                <span className="text-muted-foreground text-xs leading-tight">
                  Team workspace
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-3">
            <NavLinks
              activePath={pathname}
              onNavigate={() => onOpenChange(false)}
            />
          </div>
          <MobileUserSection
            hasUserDetails={hasUserDetails}
            userEmail={userEmail}
            userName={userName}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const isWorkflowDetail = pathname.startsWith("/workflows/");
  const userName = session?.user?.name;
  const userEmail = session?.user?.email;
  const hasUserDetails = Boolean(userName || userEmail);

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          "flex min-h-screen w-full text-foreground",
          isWorkflowDetail
            ? "pointer-events-none bg-transparent"
            : "pointer-events-auto bg-background"
        )}
      >
        <DesktopSidebar
          collapsed={collapsed}
          hasUserDetails={hasUserDetails}
          isWorkflowDetail={isWorkflowDetail}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          pathname={pathname}
          userEmail={userEmail}
          userName={userName}
        />

        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          <main
            className={cn(
              "flex-1 overflow-y-auto px-4 py-6 md:px-8",
              isWorkflowDetail
                ? "pointer-events-none bg-transparent"
                : "pointer-events-auto"
            )}
          >
            <Button
              className="fixed top-4 left-4 z-40 md:hidden"
              onClick={() => setMobileOpen(true)}
              size="icon"
              variant="ghost"
            >
              <Menu className="size-5" />
              <span className="sr-only">Open navigation</span>
            </Button>
            {children}
          </main>
        </div>

        <MobileNavigation
          hasUserDetails={hasUserDetails}
          mobileOpen={mobileOpen}
          onOpenChange={setMobileOpen}
          pathname={pathname}
          userEmail={userEmail}
          userName={userName}
        />
      </div>
    </TooltipProvider>
  );
}
