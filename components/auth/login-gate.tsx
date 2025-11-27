"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AuthDialog } from "@/components/auth/dialog";
import { signOut, useSession } from "@/lib/auth-client";

const isAnonymousUser = (user?: {
  name?: string | null;
  email?: string | null;
  isAnonymous?: boolean | null;
}) =>
  !user ||
  user.isAnonymous ||
  user.name === "Anonymous" ||
  (user.email ?? "").startsWith("temp-");

// Forces authentication on workflow routes to avoid anonymous workflows
export function LoginGate() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();

  const shouldGate =
    pathname === "/" ||
    pathname === "/workflows" ||
    pathname.startsWith("/workflows/");

  useEffect(() => {
    if (!shouldGate) {
      return;
    }
    if (session?.user && isAnonymousUser(session.user)) {
      signOut();
    }
  }, [session?.user, shouldGate]);

  if (!shouldGate || isPending) {
    return null;
  }

  if (session?.user && !isAnonymousUser(session.user)) {
    return null;
  }

  return <AuthDialog defaultMode="signin" forceOpen />;
}
