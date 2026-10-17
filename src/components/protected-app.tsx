"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useAppStore } from "@/stores/app-store";
import { DashboardView } from "@/components/views/dashboard-view";
import { ClientsView } from "@/components/views/clients-view";
import { ClientDetailView } from "@/components/views/client-detail-view";
import { ProjectsView } from "@/components/views/projects-view";
import { ProjectDetailView } from "@/components/views/project-detail-view";

/**
 * Client-side wrapper that renders the dashboard shell + current view.
 * The parent (`src/app/page.tsx`) is a server component that has already
 * verified the user is signed in AND has the `admin` role before rendering
 * this component.
 */
export function ProtectedApp({
  userName,
  userEmail,
  userRole,
}: {
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  const view = useAppStore((s) => s.view);

  return (
    <AppShell userName={userName} userEmail={userEmail} userRole={userRole}>
      {view.name === "dashboard" && <DashboardView />}
      {view.name === "clients" && <ClientsView />}
      {view.name === "client-detail" && (
        <ClientDetailView clientId={view.clientId} />
      )}
      {view.name === "projects" && <ProjectsView />}
      {view.name === "project-detail" && (
        <ProjectDetailView projectId={view.projectId} />
      )}
    </AppShell>
  );
}
