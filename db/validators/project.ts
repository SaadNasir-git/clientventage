import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod';
import { project } from '../schema';

export const insertProjectSchema = createInsertSchema(project);

export const selectProjectSchema = createSelectSchema(project);

export const updateProjectSchema = createUpdateSchema(project);