"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ActivityLog } from "@/lib/types";

export function useProjectActivity(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId, "activity"],
    enabled: !!projectId,
    queryFn: async () => {
      const { data } = await api.get<{ logs: ActivityLog[] }>(
        `/projects/${projectId}/activity`,
      );
      return data.logs;
    },
  });
}