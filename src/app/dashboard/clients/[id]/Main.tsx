"use client";

import { useState } from "react";
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Mail,
    Phone,
    Building2,
    MapPin,
    StickyNote,
    Plus,
    ExternalLink,
    Calendar,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import { useClient, useDeleteClient, toApiError } from "@/hooks/use-clients";
import { useProjects } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
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
import { ClientFormModal } from "@/components/clients/client-form-modal";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { StatusBadge } from "@/components/projects/status-badge";
import { PriorityBadge } from "@/components/projects/priority-badge";
import { formatDate, initials, daysUntil } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ClientDetailView({ clientId }: { clientId: string }) {
    const router = useRouter();
    const { data: client, isLoading, isError, error } = useClient(clientId);
    const {
        data: projects,
        isLoading: projectsLoading,
    } = useProjects({ search: "", clientId });
    const deleteMut = useDeleteClient();

    const [editOpen, setEditOpen] = useState(false);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        try {
            await deleteMut.mutateAsync(clientId);
            toast.success("Client deleted");
            router.push('/dashboard/clients');
        } catch (err) {
            const e = toApiError(err);
            const msg =
                e.status === 500
                    ? "Could not delete — this client may still have projects. Remove or reassign them first."
                    : e.message;
            toast.error(msg);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError || !client) {
        return (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
                <p className="text-sm text-destructive">
                    {isError ? toApiError(error).message : "Client not found"}
                </p>
                {/* <Button variant="outline" onClick={() => navigate({ name: "clients" })}>
                    Back to clients
                </Button> */}
                <Link href={'clients'}>
                    Back to clients
                </Link>
            </div>
        );
    }

    const projectList = projects ?? [];

    return (
        <div className="flex flex-col gap-6">
            {/* Top: back + actions */}
            <div className="flex items-center justify-between gap-3">
                <Link
                    href={`/dashboard/clients`}
                    className="-ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                >
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Clients
                </Link>
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
                    <div className="flex flex-wrap items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                            {initials(client.name) || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                {client.name}
                            </h2>
                            {client.company && (
                                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Building2 className="h-3.5 w-3.5" />
                                    {client.company}
                                </p>
                            )}
                            <p className="mt-2 text-xs text-muted-foreground">
                                Added {formatDate(client.createdAt)} · Last updated{" "}
                                {formatDate(client.updatedAt)}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <ContactItem icon={<Mail className="h-4 w-4" />} label="Email">
                            <a
                                href={`mailto:${client.email}`}
                                className="text-sm hover:underline"
                            >
                                {client.email}
                            </a>
                        </ContactItem>
                        <ContactItem icon={<Phone className="h-4 w-4" />} label="Phone">
                            <span className="text-sm">{client.phone || "—"}</span>
                        </ContactItem>
                        <ContactItem icon={<MapPin className="h-4 w-4" />} label="Address">
                            <span className="text-sm">{client.address || "—"}</span>
                        </ContactItem>
                        <ContactItem icon={<StickyNote className="h-4 w-4" />} label="Notes">
                            <span className="text-sm whitespace-pre-wrap">
                                {client.notes || "—"}
                            </span>
                        </ContactItem>
                    </div>
                </CardContent>
            </Card>

            {/* Projects for this client */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                    <div>
                        <CardTitle className="text-base">Projects</CardTitle>
                        <CardDescription>
                            {projectList.length} project{projectList.length === 1 ? "" : "s"}{" "}
                            for this client
                        </CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setProjectModalOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        New project
                    </Button>
                </CardHeader>
                <CardContent className="pt-0">
                    {projectsLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : projectList.length === 0 ? (
                        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-center">
                            <p className="text-sm font-medium">No projects yet</p>
                            <p className="text-xs text-muted-foreground">
                                Start a new project for {client.name}.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-2.5">
                            {projectList.map((p) => {
                                const days = daysUntil(p.dueDate);
                                const overdue = days < 0 && p.status !== "COMPLETED";
                                return (
                                    <Link href={`/dashboard/projects/${p.id}`}>
                                        <button
                                            key={p.id}
                                            className={cn(
                                                "group flex items-center gap-3 rounded-md border border-border bg-card p-3 text-left transition-colors",
                                                "hover:border-foreground/20 hover:bg-accent/50",
                                            )}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate font-medium">{p.title}</span>
                                                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Due {formatDate(p.dueDate)}
                                                    </span>
                                                    {overdue && (
                                                        <span className="text-destructive">
                                                            {Math.abs(days)} days overdue
                                                        </span>
                                                    )}
                                                    {days >= 0 && p.status !== "COMPLETED" && (
                                                        <span>in {days} days</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <PriorityBadge priority={p.priority} />
                                                <StatusBadge status={p.status} />
                                            </div>
                                        </button>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <ClientFormModal
                open={editOpen}
                onOpenChange={setEditOpen}
                client={client}
            />
            <ProjectFormModal
                open={projectModalOpen}
                onOpenChange={setProjectModalOpen}
                presetClientId={clientId}
            />

            <AlertDialog open={deleting} onOpenChange={setDeleting}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this client?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will archive{" "}
                            <span className="font-medium text-foreground">{client.name}</span>
                            They'll be hidden from your client list, but their data is preserved. Existing projects remain intact.            </AlertDialogDescription>
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

function ContactItem({
    icon,
    label,
    children,
}: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {icon}
                {label}
            </span>
            <div className="text-foreground">{children}</div>
        </div>
    );
}