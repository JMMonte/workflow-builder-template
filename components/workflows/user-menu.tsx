"use client";

import { LogOut, Moon, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { isSingleProviderSignInInitiated } from "@/components/auth/dialog";
import { SettingsDialog } from "@/components/settings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, TEAM_STORAGE_KEY } from "@/lib/api-client";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  showUserDetails?: boolean;
};

type UserDetailsProps = {
  className?: string;
  email?: string | null;
  emailClassName?: string;
  name?: string | null;
  nameClassName?: string;
  show?: boolean;
};

function UserDetails({
  className,
  email,
  emailClassName,
  name,
  nameClassName,
  show = true,
}: UserDetailsProps) {
  if (!(show && (email || name))) {
    return null;
  }

  return (
    <div className={cn("min-w-0 text-left", className)}>
      {name ? (
        <p className={cn("truncate font-medium text-sm", nameClassName)}>
          {name}
        </p>
      ) : null}
      {email ? (
        <p
          className={cn(
            "truncate text-muted-foreground text-xs",
            emailClassName
          )}
        >
          {email}
        </p>
      ) : null}
    </div>
  );
}

type AccountMenuItemProps = {
  hidden: boolean;
  onSelect: () => void;
};

function AccountMenuItem({ hidden, onSelect }: AccountMenuItemProps) {
  if (hidden) {
    return null;
  }

  return (
    <DropdownMenuItem onClick={onSelect}>
      <Settings className="size-4" />
      <span>Account</span>
    </DropdownMenuItem>
  );
}

export const UserMenu = ({ showUserDetails }: UserMenuProps) => {
  const { data: session, isPending } = useSession();
  const { theme, setTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TEAM_STORAGE_KEY);
    }
    await signOut();
  };

  useEffect(() => {
    if (session?.user && !session.user.name?.startsWith("Anonymous")) {
      api.user
        .get()
        .then((user) => setProviderId(user.providerId))
        .catch(() => setProviderId(null));
    }
  }, [session?.user]);

  const signInInProgress = isSingleProviderSignInInitiated();

  if (isPending && !signInInProgress) {
    return <div className="h-11 w-full" />;
  }

  const isAnonymous =
    !session?.user ||
    session.user.name === "Anonymous" ||
    session.user.email?.startsWith("temp-");

  if (isAnonymous) {
    return (
      <div className="flex w-full">
        <Button
          asChild
          className="w-full justify-center"
          size="sm"
          variant="default"
        >
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  const isOAuthUser =
    providerId === "vercel" ||
    providerId === "github" ||
    providerId === "google";

  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (session?.user?.email) {
      return session.user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const userHasDetails = Boolean(session?.user?.name || session?.user?.email);
  const shouldShowDetails = Boolean(showUserDetails && userHasDetails);

  const triggerClasses = cn(
    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-sidebar-accent",
    shouldShowDetails ? "justify-start" : "justify-center"
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={triggerClasses} variant="ghost">
          <Avatar className="h-9 w-9">
            <AvatarImage
              alt={session?.user?.name || ""}
              src={session?.user?.image || ""}
            />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
          <UserDetails
            email={session?.user?.email || null}
            name={session?.user?.name || "User"}
            show={shouldShowDetails}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <UserDetails
            className="flex flex-col space-y-1"
            email={session?.user?.email || null}
            emailClassName="leading-none"
            name={session?.user?.name || "User"}
            nameClassName="leading-none"
          />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <AccountMenuItem
          hidden={isOAuthUser}
          onSelect={() => setSettingsOpen(true)}
        />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="dark:-rotate-90 size-4 rotate-0 scale-100 transition-all dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup onValueChange={setTheme} value={theme}>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="size-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
      <SettingsDialog onOpenChange={setSettingsOpen} open={settingsOpen} />
    </DropdownMenu>
  );
};
