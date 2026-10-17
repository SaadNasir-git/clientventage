// ===== Types matching the backend schema (Drizzle) =====

export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
export type ProjectPriority = "LOW" | "MEDIUM" | "HIGH";
export type ActivityAction =
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "PROJECT_DELETED";

export interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityChange {
  name: string;
  from: unknown;
  to: unknown;
}

export interface ActivityLog {
  id: string;
  actorName: string;
  createdAt: string;
  changes: ActivityChange[];
}

// ===== Payload types for create/update =====

export interface ClientInput {
  name: string;
  company?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface ClientUpdate {
  name?: string;
  company?: string | null;
  email?: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface ProjectInput {
  clientId: string;
  title: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate: string; // ISO date (yyyy-mm-dd)
  dueDate: string; // ISO date (yyyy-mm-dd)
}

export interface ProjectUpdate {
  title?: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string;
  dueDate?: string;
}
