"use client";

import {
  Plus,
  Pencil,
  Trash2,
  Activity,
  ArrowRight,
  Loader2,
} from "lucide-react";
import type { ActivityLog } from "@/lib/types";
import {
  cn,
  formatChangeValue,
  formatDateTime,
  prettyKey,
  relativeTime,
} from "@/lib/utils";

const ACTION_META: Record<
  string,
  { label: string; icon: typeof Plus; className: string; ring: string }
> = {
  PROJECT_CREATED: {
    label: "Project created",
    icon: Plus,
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    ring: "ring-emerald-200 dark:ring-emerald-900",
  },
  PROJECT_UPDATED: {
    label: "Project updated",
    icon: Pencil,
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    ring: "ring-amber-200 dark:ring-amber-900",
  },
  PROJECT_DELETED: {
    label: "Project deleted",
    icon: Trash2,
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
    ring: "ring-rose-200 dark:ring-rose-900",
  },
};

export function ActivityTimeline({
  logs,
  isLoading,
  isError,
  emptyMessage = "No activity yet.",
}: {
  logs: ActivityLog[] | undefined;
  isLoading: boolean;
  isError: boolean;
  emptyMessage?: string;
}) {
  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-destructive">
        Failed to load activity.
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-1 text-center">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ol className="relative ml-3 border-l border-border">
      {logs.map((log, idx) => {
        // The /activity endpoint returns enhanced logs without an explicit
        // `action` field — we infer from changes presence.
        // (PROJECT_DELETED entries are not reachable here since the parent
        // project would be gone.)
        const action = inferAction(log);
        const M = ACTION_META[action];
        const Icon = M.icon;
        return (
          <li
            key={log.id}
            className={cn("relative ml-6 pb-6", idx === logs.length - 1 && "pb-0")}
          >
            {/* Dot */}
            <span
              className={cn(
                "absolute -left-[34px] flex h-6 w-6 items-center justify-center rounded-full ring-2",
                M.className,
                M.ring,
              )}
            >
              <Icon className="h-3 w-3" />
            </span>

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-medium">{log.actorName}</span>
                <span className="text-xs text-muted-foreground">
                  {M.label.toLowerCase()}
                </span>
                <span
                  className="text-xs text-muted-foreground"
                  title={formatDateTime(log.createdAt)}
                >
                  · {relativeTime(log.createdAt)}
                </span>
              </div>

              {log.changes.length > 0 && (
                <div className="mt-2 grid gap-1.5">
                  {log.changes.map((change, i) => (
                    <ChangeRow
                      key={`${log.id}-${i}-${change.name}`}
                      change={change}
                    />
                  ))}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ChangeRow({
  change,
}: {
  change: { name: string; from: unknown; to: unknown };
}) {
  const isStatus = change.name === "status";
  const isPriority = change.name === "priority";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs">
      <span className="font-medium text-foreground">
        {prettyKey(change.name)}
      </span>
      <span className="text-muted-foreground line-through">
        {isStatus || isPriority
          ? formatEnum(change.from)
          : formatChangeValue(change.from)}
      </span>
      <ArrowRight className="h-3 w-3 text-muted-foreground" />
      <span className="font-medium text-foreground">
        {isStatus || isPriority
          ? formatEnum(change.to)
          : formatChangeValue(change.to)}
      </span>
    </div>
  );
}

function formatEnum(v: unknown): string {
  if (v === null || v === undefined) return "∅";
  if (typeof v === "string") {
    return v
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }
  return String(v);
}

/**
 * The enhanced activity log shape from the API does NOT include the `action`
 * field — only { id, actorName, createdAt, changes }. We infer:
 *  - non-empty changes -> PROJECT_UPDATED
 *  - empty changes     -> PROJECT_CREATED (deletes aren't shown here because
 *                         the project record is gone, so this view won't be
 *                         reachable for deleted projects)
 */
function inferAction(_log: ActivityLog): string {
  // If the API ever exposes `action`, switch to using it.
  // For now we infer from changes presence.
  return _log.changes.length === 0 ? "PROJECT_CREATED" : "PROJECT_UPDATED";
}
