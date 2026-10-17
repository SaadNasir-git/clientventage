"use client";

import { cn, PRIORITY_META } from "@/lib/utils";
import type { ProjectPriority } from "@/lib/types";

export function PriorityBadge({
  priority,
  className,
}: {
  priority: ProjectPriority;
  className?: string;
}) {
  const meta = PRIORITY_META[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
