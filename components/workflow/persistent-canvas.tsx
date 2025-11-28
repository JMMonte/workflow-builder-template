"use client";

import { useAtomValue } from "jotai";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  isPanelAnimatingAtom,
  rightPanelWidthAtom,
} from "@/lib/workflow-store";
import { WorkflowCanvas } from "./workflow-canvas";

export function PersistentCanvas() {
  const pathname = usePathname();
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const rightPanelWidth = useAtomValue(rightPanelWidthAtom);
  const isPanelAnimating = useAtomValue(isPanelAnimatingAtom);

  // Show canvas on workflow detail pages
  const showCanvas = pathname.startsWith("/workflows/");

  // Keep canvas aligned with the visible sidebar width so it never hides underneath
  useEffect(() => {
    if (!showCanvas) {
      return;
    }

    const sidebarSelector = '[data-sidebar="desktop"]';
    let rafId: number | null = null;
    let observer: ResizeObserver | null = null;

    const updateWidth = () => {
      const sidebar = document.querySelector<HTMLElement>(sidebarSelector);
      setSidebarWidth(sidebar?.getBoundingClientRect().width ?? 0);
      return sidebar;
    };

    const watchSidebar = () => {
      const sidebar = updateWidth();
      if (!sidebar) {
        rafId = requestAnimationFrame(watchSidebar);
        return;
      }

      observer = new ResizeObserver(updateWidth);
      observer.observe(sidebar);
    };

    watchSidebar();
    window.addEventListener("resize", updateWidth);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      observer?.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, [showCanvas]);

  if (!showCanvas) {
    return null;
  }

  return (
    <div
      className="fixed inset-y-0 right-0 z-0"
      style={{
        left: sidebarWidth,
        right: rightPanelWidth ?? 0,
        transition: isPanelAnimating ? "right 300ms ease-out" : undefined,
      }}
    >
      <WorkflowCanvas />
    </div>
  );
}
