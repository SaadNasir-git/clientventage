"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { api, toApiError } from "@/lib/api";
import type { Client, ClientInput, ClientUpdate } from "@/lib/types";

export const clientKeys = {
  all: ["clients"] as const,
  list: (search: string) => ["clients", "list", search] as const,
  detail: (id: string) => ["clients", "detail", id] as const,
};

export function useClients(search: string) {
  return useQuery({
    queryKey: clientKeys.list(search),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search && search.length > 0) params.query = search;
      const { data } = await api.get<Client[]>("/clients", { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: id ? clientKeys.detail(id) : ["clients", "detail", "none"],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<Client>(`/clients/${id}`);
      return data;
    },
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClientInput) => {
      const { data } = await api.post<{ clientId: string }>("/clients", input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: ClientUpdate;
    }) => {
      const { data } = await api.patch<Client>(`/clients/${id}`, input);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      qc.invalidateQueries({ queryKey: clientKeys.detail(vars.id) });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

export { toApiError };
