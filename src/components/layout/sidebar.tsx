"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import Link from "next/link";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Clients", icon: Users, href: "/dashboard/clients" },
  { label: "Projects", icon: FolderKanban, href: "/dashboard/projects" },
] satisfies { label: string; icon: LucideIcon; href: string }[];

interface SidebarProps {
  userName: string;
  userEmail: string;
  userRole: string | undefined | null;
  onSignOut: () => void;
}

function isPathMatch(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ userName, userEmail, userRole, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  // Longest matching href = the single active item.
  const activeHref = NAV.reduce<string | null>((best, item) => {
    if (!isPathMatch(pathname, item.href)) return best;
    if (!best || item.href.length > best.length) return item.href;
    return best;
  }, null);

  return (
    <ShadcnSidebar collapsible="icon">
      {/* Branding header */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Briefcase className="h-4 w-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold leading-tight">
              ClientVentage
            </span>
            <span className="text-xs text-muted-foreground">Workspace</span>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV.map((item) => {
              const active = item.href === activeHref;
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild isActive={active}>
                    <Link href={item.href}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: tip + user card + sign out */}
      <SidebarFooter>
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <p className="font-medium text-sidebar-foreground">Tip</p>
          <p className="mt-1 leading-relaxed">
            Use the search bars to filter clients by name, email, or company —
            and projects by title.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-card p-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-gray-300">
            {initials(userName) || "?"}
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-xs font-medium text-foreground">
              {userName}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {userEmail}
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-300 group-data-[collapsible=icon]:hidden">
            {userRole ?? "user"}
          </span>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className={cn(
            "flex items-center justify-center gap-2 rounded-md border border-sidebar-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            "group-data-[collapsible=icon]:px-1.5",
          )}
        >
          <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
          <span className="hidden group-data-[collapsible=icon]:inline">↩</span>
        </button>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}