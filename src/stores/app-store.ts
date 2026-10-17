import { create } from "zustand";
import type { ProjectStatus, ProjectPriority } from "@/lib/types";

interface AppState {
  clientSearch: string;
  projectSearch: string;
  projectClientFilter: string | undefined;
  projectStatusFilter: ProjectStatus | undefined;
  projectPriorityFilter: ProjectPriority | undefined;
  // Actions
  setClientSearch: (q: string) => void;
  setProjectSearch: (q: string) => void;
  setProjectClientFilter: (clientId: string | undefined) => void;
  setProjectStatusFilter: (s: ProjectStatus | undefined) => void;
  setProjectPriorityFilter: (p: ProjectPriority | undefined) => void;
}

export const useAppStore = create<AppState>((set) => ({
  clientSearch: "",
  projectSearch: "",
  projectClientFilter: undefined,
  projectStatusFilter: undefined,
  projectPriorityFilter: undefined,
  setClientSearch: (q) => set({ clientSearch: q }),
  setProjectSearch: (q) => set({ projectSearch: q }),
  setProjectClientFilter: (clientId) => set({ projectClientFilter: clientId }),
  setProjectStatusFilter: (s) => set({ projectStatusFilter: s }),
  setProjectPriorityFilter: (p) => set({ projectPriorityFilter: p }),
}));