import { create } from "zustand";
import type { ProjectStatus, ProjectPriority } from "@/lib/types";

export type View =
  | { name: "dashboard" }
  | { name: "clients" }
  | { name: "client-detail"; clientId: string }
  | { name: "projects" }
  | { name: "project-detail"; projectId: string };

interface AppState {
  view: View;
  // Filters persisted across navigations
  clientSearch: string;
  projectSearch: string;
  projectClientFilter: string | undefined; // clientId or undefined
  projectStatusFilter: ProjectStatus | undefined;
  projectPriorityFilter: ProjectPriority | undefined;
  // Actions
  navigate: (view: View) => void;
  setClientSearch: (q: string) => void;
  setProjectSearch: (q: string) => void;
  setProjectClientFilter: (clientId: string | undefined) => void;
  setProjectStatusFilter: (s: ProjectStatus | undefined) => void;
  setProjectPriorityFilter: (p: ProjectPriority | undefined) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: { name: "dashboard" },
  clientSearch: "",
  projectSearch: "",
  projectClientFilter: undefined,
  projectStatusFilter: undefined,
  projectPriorityFilter: undefined,
  navigate: (view) => {
    set({ view });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  },
  setClientSearch: (q) => set({ clientSearch: q }),
  setProjectSearch: (q) => set({ projectSearch: q }),
  setProjectClientFilter: (clientId) => set({ projectClientFilter: clientId }),
  setProjectStatusFilter: (s) => set({ projectStatusFilter: s }),
  setProjectPriorityFilter: (p) => set({ projectPriorityFilter: p }),
}));
