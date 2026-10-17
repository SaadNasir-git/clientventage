"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Loader2,
  FolderKanban,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import {
  useProjects,
  useDeleteProject,
  toApiError,
} from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  STATUS_META,
  PRIORITY_META,
  formatDate,
  daysUntil,
  cn,
} from "@/lib/utils";
import type { Project } from "@/lib/types";

const ALL = "ALL";

export function ProjectsView() {
  const navigate = useAppStore((s) => s.navigate);
  const search = useAppStore((s) => s.projectSearch);
  const setSearch = useAppStore((s) => s.setProjectSearch);
  const statusFilter = useAppStore((s) => s.projectStatusFilter);
  const setStatusFilter = useAppStore((s) => s.setProjectStatusFilter);
  const priorityFilter = useAppStore((s) => s.projectPriorityFilter);
  const setPriorityFilter = useAppStore((s) => s.setProjectPriorityFilter);

  const { data, isLoading, isError, error, refetch } = useProjects({
    search,
    status: statusFilter,
    priority: priorityFilter,
  });
  const deleteMut = useDeleteProject();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>(undefined);
  const [deleting, setDeleting] = useState<Project | undefined>(undefined);

  const projects = data ?? [];

  const openCreate = () => {
    setEditing(undefined);
    setModalOpen(true);
  };
  const openEdit = (p: Project) => {
    setEditing(p);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMut.mutateAsync(deleting.id);
      toast.success("Project deleted");
      setDeleting(undefined);
    } catch (err) {
      const e = toApiError(err);
      toast.error(e.message);
    }
  };

  const hasActiveFilters =
    !!statusFilter || !!priorityFilter || search.length > 0;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(undefined);
    setPriorityFilter(undefined);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Projects</h2>
          <p className="text-sm text-muted-foreground">
            Track all client projects, sorted by priority then due date.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          New project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project titles"
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter ?? ALL}
          onValueChange={(v) =>
            setStatusFilter(v === ALL ? undefined : (v as Project["status"]))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {PROJECT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter ?? ALL}
          onValueChange={(v) =>
            setPriorityFilter(
              v === ALL ? undefined : (v as Project["priority"]),
            )
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All priorities</SelectItem>
            {PROJECT_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_META[p].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState
          message={toApiError(error).message}
          onRetry={() => refetch()}
        />
      ) : projects.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} onCreate={openCreate} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden sm:table-cell">Priority</TableHead>
                <TableHead className="hidden lg:table-cell">Due date</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => {
                const days = daysUntil(p.dueDate);
                const overdue = days < 0 && p.status !== "COMPLETED";
                return (
                  <TableRow
                    key={p.id}
                    className="group cursor-pointer"
                    onClick={() =>
                      navigate({ name: "project-detail", projectId: p.id })
                    }
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="truncate font-medium">{p.title}</span>
                        {p.description && (
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {p.description}
                          </span>
                        )}
                        <div className="mt-1 flex items-center gap-2 md:hidden">
                          <StatusBadge status={p.status} />
                          <PriorityBadge priority={p.priority} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <PriorityBadge priority={p.priority} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatDate(p.dueDate)}
                        </span>
                        {p.status !== "COMPLETED" && (
                          <span
                            className={cn(
                              "text-xs",
                              overdue
                                ? "text-destructive"
                                : "text-muted-foreground",
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
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(p);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          aria-label="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleting(p);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ProjectFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        project={editing}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive{" "}
              <span className="font-medium text-foreground">
                {deleting?.title}
              </span>{" "}
              It'll be hidden from your project list — its data and full activity history are preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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

function LoadingState() {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-center">
      <p className="text-sm text-destructive">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onCreate,
}: {
  hasFilters: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FolderKanban className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">
          {hasFilters ? "No matches found" : "No projects yet"}
        </p>
        <p className="text-sm text-muted-foreground">
          {hasFilters
            ? "Try adjusting your filters."
            : "Create your first project to get started."}
        </p>
      </div>
      {!hasFilters && (
        <Button onClick={onCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          New project
        </Button>
      )}
    </div>
  );
}
