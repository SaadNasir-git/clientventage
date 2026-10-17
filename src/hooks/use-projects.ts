"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { api, toApiError } from "@/lib/api";
import type {
  Project,
  ProjectInput,
  ProjectUpdate,
  ProjectStatus,
  ProjectPriority,
} from "@/lib/types";

export const projectKeys = {
  all: ["projects"] as const,
  list: (filters: {
    search: string;
    clientId?: string;
    status?: ProjectStatus;
    priority?: ProjectPriority;
  }) => ["projects", "list", filters] as const,
  detail: (id: string) => ["projects", "detail", id] as const,
};

export interface ProjectFilters {
  search: string;
  clientId?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
}

/**
 * Hook that fetches projects from the API and applies client-side
 * status/priority filters (the backend supports search + clientId only).
 */
export function useProjects(filters: ProjectFilters) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.search && filters.search.length > 0)
        params.query = filters.search;
      if (filters.clientId) params.clientId = filters.clientId;
      const { data } = await api.get<Project[]>("/projects", { params });
      return data;
    },
    placeholderData: keepPreviousData,
    select: (projects) => {
      return projects.filter((p) => {
        if (filters.status && p.status !== filters.status) return false;
        if (filters.priority && p.priority !== filters.priority) return false;
        return true;
      });
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: id ? projectKeys.detail(id) : ["projects", "detail", "none"],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<Project>(`/projects/${id}`);
      return data;
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProjectInput) => {
      const { data } = await api.post<Project>("/projects", input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: ProjectUpdate;
    }) => {
      const { data } = await api.put<{ ok: boolean }>(`/projects/${id}`, input);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(vars.id) });
      qc.invalidateQueries({
        queryKey: ["projects", vars.id, "activity"],
      });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export { toApiError };
