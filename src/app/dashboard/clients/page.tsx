"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Building2,
  Users as UsersIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/app-store";
import { useClients, useDeleteClient, toApiError } from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ClientFormModal } from "@/components/clients/client-form-modal";
import { formatDate, initials, cn } from "@/lib/utils";
import type { Client } from "@/lib/types";

export default function Page() {
  const router = useRouter();
  const search = useAppStore((s) => s.clientSearch);
  const setSearch = useAppStore((s) => s.setClientSearch);
  const { data, isLoading, isError, error, refetch } = useClients(search);
  const deleteMut = useDeleteClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | undefined>(undefined);
  const [deleting, setDeleting] = useState<Client | undefined>(undefined);

  const clients = data ?? [];

  const openCreate = () => {
    setEditing(undefined);
    setModalOpen(true);
  };
  const openEdit = (c: Client) => {
    setEditing(c);
    setModalOpen(true);
  };

  const goToClient = (id: string) => {
    router.push(`/dashboard/clients/${id}`);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMut.mutateAsync(deleting.id);
      toast.success("Client deleted");
    } catch (err) {
      const e = toApiError(err);
      toast.error(
        e.status === 500
          ? "Could not delete — make sure this client has no projects referencing them."
          : e.message,
      );
    } finally {
      setDeleting(undefined);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header row */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Clients</h2>
          <p className="text-sm text-muted-foreground">
            Manage your client roster and contact details.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          New client
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, or company"
          className="pl-9"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState
          message={safeMessage(error)}
          onRetry={() => refetch()}
        />
      ) : clients.length === 0 ? (
        <EmptyState search={search} onCreate={openCreate} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow
                  key={c.id}
                  className="group cursor-pointer"
                  role="link"
                  tabIndex={0}
                  onClick={() => goToClient(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goToClient(c.id);
                    }
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{c.name}</div>
                        <div className="truncate text-xs text-muted-foreground md:hidden">
                          {c.company ?? c.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      {c.company ? (
                        <>
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="truncate">{c.company}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <a
                      href={`mailto:${c.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{c.email}</span>
                    </a>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {c.phone ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {c.phone}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {formatDate(c.createdAt)}
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
                          openEdit(c);
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
                          setDeleting(c);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ClientFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        client={editing}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive{" "}
              <span className="font-medium text-foreground">
                {deleting?.name}
              </span>
              . They&apos;ll be hidden from your client list, but their data is
              preserved. Existing projects remain intact.
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

function safeMessage(err: unknown): string {
  try {
    return toApiError(err).message;
  } catch {
    return "Something went wrong.";
  }
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {initials(name) || "?"}
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
  search,
  onCreate,
}: {
  search: string;
  onCreate: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-center",
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <UsersIcon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">
          {search ? "No matches found" : "No clients yet"}
        </p>
        <p className="text-sm text-muted-foreground">
          {search
            ? `Nothing matches "${search}". Try a different query.`
            : "Get started by creating your first client."}
        </p>
      </div>
      {!search && (
        <Button onClick={onCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          New client
        </Button>
      )}
    </div>
  );
}