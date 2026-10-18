// ===== Types matching the backend schema (Drizzle) =====

import { activityActionEnum, client, project, projectPriorityEnum, projectStatusEnum, user } from "@/db/schema";
import { insertClientSchema, insertProjectSchema, updateClientSchema, updateProjectSchema } from "@/db/validators";
import { z } from 'zod';

export type ProjectStatus = typeof projectStatusEnum.enumValues[number];
export type ProjectPriority = typeof projectPriorityEnum.enumValues[number];
export type ActivityAction = typeof activityActionEnum.enumValues[number];

export type Client = Omit<typeof client.$inferSelect, "deletedAt"> & {
  createdAt: string;
  updatedAt: string;
}

export type Project = Omit<typeof project.$inferSelect, "deletedAt"> & {
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

type OmitType = "id" | "createdAt" | "updatedAt" | "deletedAt";

export type ClientInput = Omit<z.infer<typeof insertClientSchema>, OmitType>

export type ClientUpdate = Omit<z.infer<typeof updateClientSchema>, OmitType>

export type ProjectInput = Omit<z.infer<typeof insertProjectSchema>, OmitType>

export type ProjectUpdate = Omit<z.infer<typeof updateProjectSchema>, OmitType>

export type User = Omit<typeof user.$inferSelect, "createdAt" | "updatedAt" | "image" | "role"> & {
  image?: string | null | undefined;
  role: "user" | "admin" | null | undefined;
}