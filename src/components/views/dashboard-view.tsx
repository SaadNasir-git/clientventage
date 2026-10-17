"use client";

import { useMemo, useState } from "react";
import {
  Users,
  FolderKanban,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Plus,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { useClients } from "@/hooks/use-clients";
import { useProjects } from "@/hooks/use-projects";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/projects/status-badge";
import { PriorityBadge } from "@/components/projects/priority-badge";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { ClientFormModal } from "@/components/clients/client-form-modal";
import {
  cn,
  formatDate,
  daysUntil,
  initials,
  STATUS_META,
} from "@/lib/utils";
import type { Project, ProjectStatus } from "@/lib/types";

export function DashboardView() {
  const navigate = useAppStore((s) => s.navigate);
  const { data: clients, isLoading: clientsLoading } = useClients("");
  const { data: projects, isLoading: projectsLoading } = useProjects({
    search: "",
  });

  const [clientModal, setClientModal] = useState(false);
  const [projectModal, setProjectModal] = useState(false);

  const projectList = useMemo(() => projects ?? [], [projects]);
  const clientList = useMemo(() => clients ?? [], [clients]);

  // Stats — pure, deterministic (empty list during prerender → zeros)
  const stats = useMemo(() => computeStats(projectList), [projectList]);

  // Upcoming deadlines (not completed), sorted by due date
  const upcoming = useMemo(
    () =>
      projectList
        .filter((p) => p.status !== "COMPLETED")
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        )
        .slice(0, 5),
    [projectList],
  );

  // Recent projects (newest createdAt first)
  const recent = useMemo(
    () =>
      [...projectList]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5),
    [projectList],
  );

  // Recent clients (newest createdAt first)
  const recentClients = useMemo(
    () =>
      [...clientList]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5),
    [clientList],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Hero / welcome */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your clients and projects.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setClientModal(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New client
          </Button>
          <Button onClick={() => setProjectModal(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New project
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total clients"
          value={clientsLoading ? "—" : String(clientList.length)}
          icon={<Users className="h-5 w-5" />}
          accent="bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
          onClick={() => navigate({ name: "clients" })}
        />
        <StatCard
          label="Total projects"
          value={projectsLoading ? "—" : String(projectList.length)}
          icon={<FolderKanban className="h-5 w-5" />}
          accent="bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"
          onClick={() => navigate({ name: "projects" })}
        />
        <StatCard
          label="In progress"
          value={projectsLoading ? "—" : String(stats.inProgress)}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
          onClick={() => navigate({ name: "projects" })}
        />
        <StatCard
          label="Overdue"
          value={projectsLoading ? "—" : String(stats.overdue)}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
          onClick={() => navigate({ name: "projects" })}
        />
      </div>

      {/* Status distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projects by status</CardTitle>
          <CardDescription>Distribution across the pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(["PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETED"] as ProjectStatus[]).map(
              (status) => {
                const count = stats.byStatus[status];
                const total = projectList.length || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div
                    key={status}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge status={status} />
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", STATUS_META[status].dot)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                );
              },
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two-column: upcoming + recent */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Upcoming deadlines
              </CardTitle>
              <CardDescription>Next 5 due, not completed</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ name: "projects" })}
            >
              View all
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <SkeletonRows />
            ) : upcoming.length === 0 ? (
              <EmptyRow
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="All clear"
                subtitle="No upcoming deadlines."
              />
            ) : (
              <div className="grid gap-1.5">
                {upcoming.map((p) => {
                  const days = daysUntil(p.dueDate);
                  const overdue = days < 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        navigate({ name: "project-detail", projectId: p.id })
                      }
                      className={cn(
                        "group flex items-center gap-3 rounded-md border border-transparent p-2 text-left transition-colors",
                        "hover:border-border hover:bg-accent/50",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {p.title}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(p.dueDate)}
                        </div>
                      </div>
                      <PriorityBadge priority={p.priority} />
                      <span
                        className={cn(
                          "shrink-0 text-xs font-medium",
                          overdue
                            ? "text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        {overdue
                          ? `${Math.abs(days)}d overdue`
                          : days === 0
                            ? "today"
                            : `${days}d`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                Recently created
              </CardTitle>
              <CardDescription>Latest 5 projects</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ name: "projects" })}
            >
              View all
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <SkeletonRows />
            ) : recent.length === 0 ? (
              <EmptyRow
                icon={<FolderKanban className="h-5 w-5" />}
                title="No projects yet"
                subtitle="Create your first project."
              />
            ) : (
              <div className="grid gap-1.5">
                {recent.map((p) => (
                  <button
                    key={p.id}
                    onClick={() =>
                      navigate({ name: "project-detail", projectId: p.id })
                    }
                    className={cn(
                      "group flex items-center gap-3 rounded-md border border-transparent p-2 text-left transition-colors",
                      "hover:border-border hover:bg-accent/50",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {p.title}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Created {formatDate(p.createdAt)}
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent clients */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Recent clients
            </CardTitle>
            <CardDescription>Latest 5 clients added</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ name: "clients" })}
          >
            View all
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          {clientsLoading ? (
            <SkeletonRows />
          ) : clientList.length === 0 ? (
            <EmptyRow
              icon={<Users className="h-5 w-5" />}
              title="No clients yet"
              subtitle="Add your first client."
            />
          ) : (
            <div className="grid gap-1.5">
              {recentClients.map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    navigate({ name: "client-detail", clientId: c.id })
                  }
                  className={cn(
                    "group flex items-center gap-3 rounded-md border border-transparent p-2 text-left transition-colors",
                    "hover:border-border hover:bg-accent/50",
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials(c.name) || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {c.company || c.email}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(c.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ClientFormModal open={clientModal} onOpenChange={setClientModal} />
      <ProjectFormModal open={projectModal} onOpenChange={setProjectModal} />
    </div>
  );
}

function computeStats(projects: Project[]) {
  const byStatus: Record<ProjectStatus, number> = {
    PLANNING: 0,
    IN_PROGRESS: 0,
    REVIEW: 0,
    COMPLETED: 0,
  };
  let overdue = 0;
  let inProgress = 0;
  for (const p of projects) {
    byStatus[p.status]++;
    if (p.status === "IN_PROGRESS") inProgress++;
    const days = daysUntil(p.dueDate);
    if (days < 0 && p.status !== "COMPLETED") overdue++;
  }
  return { byStatus, overdue, inProgress };
}

function StatCard({
  label,
  value,
  icon,
  accent,
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-start justify-between rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-foreground/20 hover:bg-accent/40"
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
      </div>
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          accent,
        )}
      >
        {icon}
      </div>
    </button>
  );
}

function SkeletonRows() {
  return (
    <div className="grid gap-1.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-md bg-muted/40" />
      ))}
    </div>
  );
}

function EmptyRow({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex h-24 flex-col items-center justify-center gap-1 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}