"use client";

import { LogOut } from "lucide-react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const SECTION_TITLES: Record<string, { list: string; detail: string }> = {
  clients: { list: "Clients", detail: "Client" },
  projects: { list: "Projects", detail: "Project" },
};

const FALLBACK_TITLE = "Client and Project Hub";

interface AppShellProps {
  userName: string;
  userEmail: string;
  userRole: string | undefined | null;
  children: React.ReactNode;
}

/**
 * Resolve the header title from the URL.
 *   /dashboard                 → "Dashboard"
 *   /dashboard/clients         → "Clients"
 *   /dashboard/clients/<id>    → "Client"
 *   /dashboard/projects        → "Projects"
 *   /dashboard/projects/<id>   → "Project"
 */
function deriveTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return "Dashboard"; // "/" or "/dashboard"
  const section = segments[1];
  const meta = SECTION_TITLES[section];
  if (!meta) return FALLBACK_TITLE;
  return segments.length > 2 ? meta.detail : meta.list;
}

/**
 * Closes the mobile drawer whenever the route changes.
 * Renders nothing. Must live inside <SidebarProvider>.
 */
function CloseMobileOnNavigate() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return null;
}

export function AppShell({
  userName,
  userEmail,
  userRole,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const title = deriveTitle(pathname);

  const onSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out");
    } catch {
      toast.error("Couldn't reach the server — you may still be signed in.");
    }
    // Hard reset — clears React Query / Zustand / any client caches so the
    // authed shell can't be resurrected via the back button.
    window.location.href = "/signin";
  };

  return (
    <SidebarProvider>
      <CloseMobileOnNavigate />

      <Sidebar
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        onSignOut={onSignOut}
      />

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
          <SidebarTrigger className="-ml-2" />
          <h1 className="text-base font-semibold md:text-lg">{title}</h1>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full p-0"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-xs font-semibold text-gray-300">
                      {initials(userName) || "?"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {userEmail}
                  </span>
                  <span className="mt-1 inline-flex w-fit items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-primary text-gray-300">
                    {userRole ?? "user"}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}