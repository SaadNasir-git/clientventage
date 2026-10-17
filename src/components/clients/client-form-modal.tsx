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
  useCreateClient,
  useUpdateClient,
  toApiError,
} from "@/hooks/use-clients";
import type { Client, ClientInput, ClientUpdate } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing client when editing; undefined when creating */
  client?: Client;
  onCreated?: (clientId: string) => void;
}

interface FormValues {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export function ClientFormModal({
  open,
  onOpenChange,
  client,
  onCreated,
}: Props) {
  const isEdit = !!client;
  const createMut = useCreateClient();
  const updateMut = useUpdateClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: client?.name ?? "",
        company: client?.company ?? "",
        email: client?.email ?? "",
        phone: client?.phone ?? "",
        address: client?.address ?? "",
        notes: client?.notes ?? "",
      });
    }
  }, [open, client, reset]);

  const onSubmit = async (values: FormValues) => {
    const trimmed: FormValues = {
      name: values.name.trim(),
      company: values.company.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      address: values.address.trim(),
      notes: values.notes.trim(),
    };

    try {
      if (isEdit && client) {
        const payload: ClientUpdate = {
          name: trimmed.name,
          company: trimmed.company || null,
          email: trimmed.email,
          phone: trimmed.phone || null,
          address: trimmed.address || null,
          notes: trimmed.notes || null,
        };
        await updateMut.mutateAsync({ id: client.id, input: payload });
        toast.success("Client updated");
      } else {
        const payload: ClientInput = {
          name: trimmed.name,
          company: trimmed.company || null,
          email: trimmed.email,
          phone: trimmed.phone || null,
          address: trimmed.address || null,
          notes: trimmed.notes || null,
        };
        const res = await createMut.mutateAsync(payload);
        toast.success("Client created");
        onCreated?.(res.clientId);
      }
      onOpenChange(false);
    } catch (err) {
      const e = toApiError(err);
      toast.error(e.message);
    }
  };

  const busy = isSubmitting || createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit client" : "New client"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the contact details for this client."
              : "Add a new client to your workspace."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 py-2"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required error={errors.name?.message}>
              <Input
                {...register("name", { required: "Name is required" })}
                placeholder="Jane Doe"
                autoFocus
              />
            </Field>
            <Field label="Company" error={errors.company?.message}>
              <Input {...register("company")} placeholder="Acme Inc." />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" required error={errors.email?.message}>
              <Input
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
                placeholder="jane@acme.com"
              />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <Input {...register("phone")} placeholder="+1 555 0100" />
            </Field>
          </div>

          <Field label="Address" error={errors.address?.message}>
            <Textarea
              {...register("address")}
              rows={2}
              placeholder="123 Main St, Springfield, USA"
            />
          </Field>

          <Field label="Notes" error={errors.notes?.message}>
            <Textarea
              {...register("notes")}
              rows={3}
              placeholder="Internal notes about this client..."
            />
          </Field>

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
              {isEdit ? "Save changes" : "Create client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
