import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod';
import { z } from 'zod';
import { project } from '../schema';

export const insertProjectSchema = createInsertSchema(project);

export const selectProjectSchema = createSelectSchema(project);

export const updateProjectSchema = createUpdateSchema(project);

export type ProjectInput = z.infer<typeof insertProjectSchema>;