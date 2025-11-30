"use client";

import { useAtomValue } from "jotai";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Menu,
  Plug,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { useEffect, useRef, useState } from "react";
import { TeamSelector } from "@/components/navigation/team-selector";
import { WorkflowRunIndicator } from "@/components/navigation/workflow-run-indicator";
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
import { TEAM_STORAGE_KEY } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { isExecutingAtom } from "@/lib/workflow-store";

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
    label: "Members",
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

type NavLinkItemProps = {
  collapsed?: boolean;
  isActive: boolean;
  isRunning: boolean;
  item: NavItem;
  onNavigate?: () => void;
};

function NavLinkItem({
  collapsed,
  isActive,
  isRunning,
  item,
  onNavigate,
}: NavLinkItemProps) {
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
      {collapsed ? null : (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {isRunning ? (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-[11px] text-emerald-700 dark:text-emerald-200">
              <Loader2 className="size-3 animate-spin" />
              Running
            </span>
          ) : null}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0} key={item.href}>
        <TooltipTrigger asChild>
          <div className="relative">
            {linkContent}
            {isRunning ? (
              <span className="pointer-events-none absolute top-2 right-2 flex size-2 rounded-full bg-emerald-500 shadow-sm ring-2 ring-background" />
            ) : null}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="relative" key={item.href}>
      {linkContent}
    </div>
  );
}

function NavLinks({ activePath, collapsed, onNavigate }: NavLinksProps) {
  const isExecuting = useAtomValue(isExecutingAtom);

  return (
    <div className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          activePath === item.href || activePath.startsWith(`${item.href}/`);

        return (
          <NavLinkItem
            collapsed={collapsed}
            isActive={isActive}
            isRunning={isExecuting && item.href === "/workflows"}
            item={item}
            key={item.href}
            onNavigate={onNavigate}
          />
        );
      })}
    </div>
  );
}

type AppShellProps = {
  children: ReactNode;
};

type SidebarUserSectionProps = {
  collapsed: boolean;
  hasUserDetails: boolean;
};

function SidebarUserSection({
  collapsed,
  hasUserDetails,
}: SidebarUserSectionProps) {
  return (
    <div className="mt-auto px-3 pb-4">
      <Separator className="mb-3" />
      <UserMenu showUserDetails={!collapsed && hasUserDetails} />
    </div>
  );
}

type MobileUserSectionProps = {
  hasUserDetails: boolean;
};

function MobileUserSection({ hasUserDetails }: MobileUserSectionProps) {
  return (
    <div className="border-t px-4 py-4">
      <UserMenu showUserDetails={hasUserDetails} />
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
}: DesktopSidebarProps) {
  return (
    <aside
      className={cn(
        "relative hidden h-screen border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
        collapsed ? "w-[76px]" : "w-64",
        isWorkflowDetail && "pointer-events-auto"
      )}
      data-sidebar="desktop"
    >
      <div className="flex w-full flex-col">
        <div className="px-2 py-3">
          <TeamSelector collapsed={collapsed} />
        </div>
        <Separator />
        <div className="px-2 py-2">
          <NavLinks activePath={pathname} collapsed={collapsed} />
        </div>
        <SidebarUserSection
          collapsed={collapsed}
          hasUserDetails={hasUserDetails}
        />
      </div>
      <button
        className="group absolute top-16 right-0 z-30 hidden h-10 w-4 translate-x-1/2 items-center justify-center rounded-md border bg-background/90 text-sidebar-foreground shadow-sm ring-1 ring-border transition hover:bg-muted md:flex"
        onClick={onToggleCollapse}
        type="button"
      >
        {collapsed ? (
          <ChevronRight className="size-3" />
        ) : (
          <ChevronLeft className="size-3" />
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
}: MobileNavigationProps) {
  return (
    <Sheet onOpenChange={onOpenChange} open={mobileOpen}>
      <SheetContent className="w-80 border-r p-0" side="left">
        <div className="flex h-full flex-col">
          <div className="border-b px-2 py-3">
            <TeamSelector />
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-3">
            <NavLinks
              activePath={pathname}
              onNavigate={() => onOpenChange(false)}
            />
          </div>
          <MobileUserSection hasUserDetails={hasUserDetails} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastTeamId = useRef<string | null>(null);
  const { data: session } = useSession();
  const isWorkflowDetail = pathname.startsWith("/workflows/");
  const hasUserDetails = Boolean(session?.user?.name || session?.user?.email);

  useEffect(() => {
    if (typeof window !== "undefined") {
      lastTeamId.current = window.localStorage.getItem(TEAM_STORAGE_KEY);
    }

    const handleTeamChange = (event: Event) => {
      let nextTeamId: string | null = null;

      if (event instanceof CustomEvent) {
        nextTeamId =
          (event as CustomEvent<{ teamId?: string | null }>).detail?.teamId ??
          null;
      } else if (
        event instanceof StorageEvent &&
        event.key === TEAM_STORAGE_KEY
      ) {
        nextTeamId = event.newValue;
      }

      if (nextTeamId === lastTeamId.current) {
        return;
      }

      lastTeamId.current = nextTeamId;
      router.refresh();
    };

    window.addEventListener("active-team-change", handleTeamChange);
    window.addEventListener("storage", handleTeamChange);

    return () => {
      window.removeEventListener("active-team-change", handleTeamChange);
      window.removeEventListener("storage", handleTeamChange);
    };
  }, [router]);

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
        />
        <WorkflowRunIndicator />
      </div>
    </TooltipProvider>
  );
}
