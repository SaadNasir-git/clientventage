"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateProject,
  useUpdateProject,
  toApiError,
} from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import type {
  Project,
  ProjectInput,
  ProjectUpdate,
  ProjectStatus,
  ProjectPriority,
} from "@/lib/types";
import {
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  STATUS_META,
  PRIORITY_META,
  toDateInputValue,
} from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  presetClientId?: string;
  onCreated?: (projectId: string) => void;
}

interface FormValues {
  clientId: string;
  title: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  dueDate: string;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export function ProjectFormModal({
  open,
  onOpenChange,
  project,
  presetClientId,
  onCreated,
}: Props) {
  const isEdit = !!project;
  const createMut = useCreateProject();
  const updateMut = useUpdateProject();
  const { data: clients, isLoading: clientsLoading } = useClients("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      clientId: presetClientId ?? "",
      title: "",
      description: "",
      status: "PLANNING",
      priority: "MEDIUM",
      startDate: "",
      dueDate: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        clientId: project?.clientId ?? presetClientId ?? "",
        title: project?.title ?? "",
        description: project?.description ?? "",
        status: project?.status ?? "PLANNING",
        priority: project?.priority ?? "MEDIUM",
        startDate: toDateInputValue(project?.startDate) || todayStr(),
        dueDate: toDateInputValue(project?.dueDate) || todayStr(),
      });
    }
  }, [open, project, presetClientId, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!values.clientId) {
      toast.error("Please pick a client");
      return;
    }
    if (new Date(values.dueDate) < new Date(values.startDate)) {
      toast.error("Due date cannot be before start date");
      return;
    }

    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      status: values.status,
      priority: values.priority,
      startDate: values.startDate,
      dueDate: values.dueDate,
    };

    try {
      if (isEdit && project) {
        const update: ProjectUpdate = payload;
        await updateMut.mutateAsync({ id: project.id, input: update });
        toast.success("Project updated");
      } else {
        const input: ProjectInput = { clientId: values.clientId, ...payload };
        const res = await createMut.mutateAsync(input);
        toast.success("Project created");
        onCreated?.(res.id);
      }
      onOpenChange(false);
    } catch (err) {
      const e = toApiError(err);
      toast.error(e.message);
    }
  };

  const busy = isSubmitting || createMut.isPending || updateMut.isPending;
  const statusValue = watch("status");
  const priorityValue = watch("priority");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the project details."
              : "Create a new project and assign it to a client."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 py-2"
          noValidate
        >
          {/* Client select */}
          <div className="grid gap-1.5">
            <Label className="text-sm font-medium">
              Client <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch("clientId")}
              onValueChange={(v) => setValue("clientId", v, { shouldValidate: true })}
              disabled={isEdit || clientsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    clientsLoading ? "Loading clients..." : "Select a client"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(clients ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.company && (
                      <span className="text-muted-foreground"> · {c.company}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientId && (
              <p className="text-xs text-destructive">
                {errors.clientId.message}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("title", { required: "Title is required" })}
              placeholder="Website redesign"
              autoFocus
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label className="text-sm font-medium">Description</Label>
            <Textarea
              {...register("description")}
              rows={3}
              placeholder="Short summary of the project scope..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={statusValue}
                onValueChange={(v) =>
                  setValue("status", v as ProjectStatus, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_META[s].dot}`}
                        />
                        {STATUS_META[s].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">Priority</Label>
              <Select
                value={priorityValue}
                onValueChange={(v) =>
                  setValue("priority", v as ProjectPriority, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">
                Start date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                {...register("startDate", { required: "Required" })}
              />
              {errors.startDate && (
                <p className="text-xs text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">
                Due date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                {...register("dueDate", { required: "Required" })}
              />
              {errors.dueDate && (
                <p className="text-xs text-destructive">
                  {errors.dueDate.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}