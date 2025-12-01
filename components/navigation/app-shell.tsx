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
import { useCallback, useEffect, useRef, useState } from "react";
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

const SIDEBAR_COLLAPSED_KEY = "app-sidebar-collapsed";
const SIDEBAR_STORAGE_KEY = "app-sidebar-width";
const SIDEBAR_COLLAPSED_WIDTH = 76;
const SIDEBAR_DEFAULT_WIDTH = 260;
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 360;

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
  collapsedWidth: number;
  isDragging: boolean;
  isWorkflowDetail: boolean;
  onResizeStart: (event: React.MouseEvent<HTMLDivElement>) => void;
  onToggleCollapse: () => void;
  pathname: string;
  width: number;
};

function DesktopSidebar({
  collapsed,
  collapsedWidth,
  hasUserDetails,
  isDragging,
  isWorkflowDetail,
  onResizeStart,
  onToggleCollapse,
  pathname,
  width,
}: DesktopSidebarProps) {
  const sidebarWidth = collapsed ? collapsedWidth : width;

  return (
    <aside
      className={cn(
        "relative hidden h-screen border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
        isWorkflowDetail && "pointer-events-auto"
      )}
      data-sidebar="desktop"
      style={{ width: sidebarWidth }}
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

      {collapsed ? null : (
        <>
          {/* biome-ignore lint/a11y/useSemanticElements: custom resize handle */}
          <div
            aria-orientation="vertical"
            aria-valuenow={Math.round(width)}
            className="group absolute inset-y-0 right-0 z-30 w-3 cursor-col-resize"
            onMouseDown={onResizeStart}
            role="separator"
            tabIndex={0}
          >
            <div className="absolute inset-y-0 right-0 w-1 bg-transparent transition-colors group-hover:bg-blue-500 group-active:bg-blue-600" />
            {isDragging ? null : (
              <button
                className="-translate-y-1/2 absolute top-1/2 right-0 flex size-6 translate-x-1/2 items-center justify-center rounded-full border bg-background opacity-0 shadow-sm transition-opacity hover:bg-muted group-hover:opacity-100"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleCollapse();
                }}
                onMouseDown={(event) => event.stopPropagation()}
                type="button"
              >
                <ChevronLeft className="size-4" />
                <span className="sr-only">Collapse sidebar</span>
              </button>
            )}
          </div>
        </>
      )}

      {collapsed ? (
        <button
          className="-translate-y-1/2 -right-3 absolute top-1/2 z-30 flex size-6 items-center justify-center rounded-r-full border border-l-0 bg-background shadow-sm transition-colors hover:bg-muted"
          onClick={onToggleCollapse}
          type="button"
        >
          <ChevronRight className="size-4" />
          <span className="sr-only">Expand sidebar</span>
        </button>
      ) : null}
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
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const isSidebarResizingRef = useRef(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastTeamId = useRef<string | null>(null);
  const { data: session } = useSession();
  const isWorkflowDetail = pathname.startsWith("/workflows/");
  const hasUserDetails = Boolean(session?.user?.name || session?.user?.email);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedWidth = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (storedWidth) {
      const parsedWidth = Number.parseInt(storedWidth, 10);
      if (!Number.isNaN(parsedWidth)) {
        setSidebarWidth(
          Math.min(
            Math.min(SIDEBAR_MAX_WIDTH, window.innerWidth * 0.5),
            Math.max(SIDEBAR_MIN_WIDTH, parsedWidth)
          )
        );
      }
    }
    const storedCollapsed = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (storedCollapsed) {
      setCollapsed(storedCollapsed === "true");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  const handleSidebarResizeStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (collapsed) {
        return;
      }
      event.preventDefault();
      isSidebarResizingRef.current = true;
      setIsDraggingSidebar(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isSidebarResizingRef.current) {
          return;
        }
        const maxWidth = Math.min(SIDEBAR_MAX_WIDTH, window.innerWidth * 0.5);
        const newWidth = Math.min(
          maxWidth,
          Math.max(SIDEBAR_MIN_WIDTH, moveEvent.clientX)
        );
        setSidebarWidth(newWidth);
      };

      const handleMouseUp = () => {
        isSidebarResizingRef.current = false;
        setIsDraggingSidebar(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [collapsed]
  );

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
          collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
          hasUserDetails={hasUserDetails}
          isDragging={isDraggingSidebar}
          isWorkflowDetail={isWorkflowDetail}
          onResizeStart={handleSidebarResizeStart}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          pathname={pathname}
          width={sidebarWidth}
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
