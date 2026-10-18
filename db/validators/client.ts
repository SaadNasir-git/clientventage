import { client } from '@/db/schema/client';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod';

export const insertClientSchema = createInsertSchema(client, {
  email: (schema) => schema.email(),
});

export const selectClientSchema = createSelectSchema(client);

export const updateClientSchema = createUpdateSchema(client);