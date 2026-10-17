"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  User as UserIcon,
  FileText,
  Loader2,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import {
  useProject,
  useDeleteProject,
  toApiError,
} from "@/hooks/use-projects";
import { useClient } from "@/hooks/use-clients";
import { useProjectActivity } from "@/hooks/use-activity";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { StatusBadge } from "@/components/projects/status-badge";
import { PriorityBadge } from "@/components/projects/priority-badge";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { formatDate, daysUntil, cn } from "@/lib/utils";

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const navigate = useAppStore((s) => s.navigate);
  const { data: project, isLoading, isError, error } = useProject(projectId);
  const { data: client } = useClient(project?.clientId);
  const {
    data: logs,
    isLoading: logsLoading,
    isError: logsError,
  } = useProjectActivity(projectId);
  const deleteMut = useDeleteProject();

  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteMut.mutateAsync(projectId);
      toast.success("Project deleted");
      navigate({ name: "projects" });
    } catch (err) {
      const e = toApiError(err);
      toast.error(e.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-destructive">
          {isError ? toApiError(error).message : "Project not found"}
        </p>
        <Button variant="outline" onClick={() => navigate({ name: "projects" })}>
          Back to projects
        </Button>
      </div>
    );
  }

  const days = daysUntil(project.dueDate);
  const overdue = days < 0 && project.status !== "COMPLETED";
  const totalDays =
    (new Date(project.dueDate).getTime() -
      new Date(project.startDate).getTime()) /
    (1000 * 60 * 60 * 24);
  const elapsed =
    (Date.now() - new Date(project.startDate).getTime()) /
    (1000 * 60 * 60 * 24);
  const progress =
    project.status === "COMPLETED"
      ? 100
      : Math.max(0, Math.min(100, Math.round((elapsed / Math.max(totalDays, 1)) * 100)));

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ name: "projects" })}
          className="-ml-2"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Projects
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleting(true)}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                {project.title}
              </h2>
              {project.description && (
                <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-muted-foreground">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          <Separator className="my-5" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Client">
              {client ? (
                <button
                  onClick={() =>
                    navigate({ name: "client-detail", clientId: client.id })
                  }
                  className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                >
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  {client.name}
                </button>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </Stat>
            <Stat label="Start date">
              <span className="inline-flex items-center gap-1.5 text-sm">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {formatDate(project.startDate)}
              </span>
            </Stat>
            <Stat label="Due date">
              <div className="flex flex-col">
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(project.dueDate)}
                </span>
                {project.status !== "COMPLETED" && (
                  <span
                    className={cn(
                      "text-xs",
                      overdue ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    <Clock className="mr-1 inline h-3 w-3" />
                    {overdue
                      ? `${Math.abs(days)} days overdue`
                      : days === 0
                        ? "Due today"
                        : `in ${days} days`}
                  </span>
                )}
              </div>
            </Stat>
            <Stat label="Created">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                {formatDate(project.createdAt)}
              </span>
            </Stat>
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium">Timeline</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  overdue
                    ? "bg-destructive"
                    : project.status === "COMPLETED"
                      ? "bg-emerald-500"
                      : "bg-primary",
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-muted-foreground" />
            Activity log
          </CardTitle>
          <CardDescription>
            Latest 100 changes, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityTimeline
            logs={logs}
            isLoading={logsLoading}
            isError={logsError}
          />
        </CardContent>
      </Card>

      <ProjectFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
      />

      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive{" "}
              <span className="font-medium text-foreground">
                {project.title}
              </span>{" "}
              It'll be hidden from your project list — its data and full activity history are preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}
