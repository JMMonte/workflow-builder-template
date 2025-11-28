"use client";

import { type IconOption } from "@/components/ui/icon-options";
import { cn } from "@/lib/utils";

type IconGridProps = {
  options: IconOption[];
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export function IconGrid({
  options,
  value,
  onChange,
  disabled,
  className,
  id,
}: IconGridProps) {
  return (
    <div className={cn("grid grid-cols-7 gap-2", className)} id={id}>
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            aria-label={option.label}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md border text-muted-foreground transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isSelected && "border-primary bg-primary/10 text-primary",
              disabled && "cursor-not-allowed opacity-60"
            )}
            disabled={disabled}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <option.Icon className="size-5" />
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
