"use client";

import { usePathname } from "next/navigation";
import { WorkflowCanvas } from "./workflow-canvas";

export function PersistentCanvas() {
  const pathname = usePathname();

  // Show canvas on workflow detail pages
  const showCanvas = pathname.startsWith("/workflows/");

  if (!showCanvas) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-0">
      <WorkflowCanvas />
    </div>
  );
}
