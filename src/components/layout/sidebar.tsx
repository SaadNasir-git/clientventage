"use client";

import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useAppStore, type View } from "@/stores/app-store";

interface NavItem {
  label: string;
  icon: LucideIcon;
  view: View;
  match: View["name"][];
}

const NAV: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    view: { name: "dashboard" },
    match: ["dashboard"],
  },
  {
    label: "Clients",
    icon: Users,
    view: { name: "clients" },
    match: ["clients", "client-detail"],
  },
  {
    label: "Projects",
    icon: FolderKanban,
    view: { name: "projects" },
    match: ["projects", "project-detail"],
  },
];

interface SidebarProps {
  userName: string;
  userEmail: string;
  userRole: string;
  onSignOut: () => void;
  /** Optional: invoked when a nav item is clicked (used to close mobile drawer). */
  onNavigate?: () => void;
}

export function Sidebar({
  userName,
  userEmail,
  userRole,
  onSignOut,
  onNavigate,
}: SidebarProps) {
  const view = useAppStore((s) => s.view);
  const navigate = useAppStore((s) => s.navigate);

  return (
    <aside className="flex h-full w-full flex-col gap-2 bg-sidebar p-3 text-sidebar-foreground">
      <div className="flex items-center gap-2 px-2 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Briefcase className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">
            ClientVentage
          </span>
          <span className="text-xs text-muted-foreground">Workspace</span>
        </div>
      </div>

      <nav className="mt-2 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.match.includes(view.name);
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => {
                navigate(item.view);
                onNavigate?.();
              }}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active &&
                  "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-sidebar-foreground">Tip</p>
          <p className="mt-1 leading-relaxed">
            Use the search bars to filter clients by name, email, or company —
            and projects by title.
          </p>
        </div>

        {/* Signed-in user card */}
        <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-card p-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(userName) || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-foreground">
              {userName}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {userEmail}
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
            {userRole}
          </span>
        </div>

        <button
          onClick={onSignOut}
          className="flex items-center justify-center gap-2 rounded-md border border-sidebar-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
