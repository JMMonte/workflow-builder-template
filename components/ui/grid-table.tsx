import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type GridTableColumn = {
  id?: string;
  label: ReactNode;
  align?: "left" | "right";
  className?: string;
};

type GridTableProps = {
  columns: GridTableColumn[];
  template: string;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
};

export function GridTable({
  columns,
  template,
  children,
  className,
  headerClassName,
}: GridTableProps) {
  return (
    <div className={cn("overflow-hidden rounded-[0.5rem] border", className)}>
      <div
        className={cn(
          "grid items-center gap-4 border-b bg-muted/50 px-4 py-2",
          template,
          headerClassName
        )}
      >
        {columns.map((column, index) => (
          <div
            className={cn(
              "text-muted-foreground text-xs font-medium uppercase",
              column.align === "right" && "text-right",
              column.className
            )}
            key={column.id || index}
          >
            {column.label}
          </div>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}

type GridTableRowProps = {
  template: string;
  children: ReactNode;
  className?: string;
};

export function GridTableRow({
  template,
  children,
  className,
}: GridTableRowProps) {
  return (
    <div
      className={cn(
        "grid items-center gap-4 border-b px-4 py-3 last:border-b-0",
        template,
        className
      )}
    >
      {children}
    </div>
  );
}
