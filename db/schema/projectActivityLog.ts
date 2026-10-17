import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { client } from "./client";
import { project } from "./project";

export const activityActionEnum = pgEnum("activity_action", [
    "PROJECT_CREATED",
    "PROJECT_UPDATED",
    "PROJECT_DELETED"
]);

export const projectActivityLog = pgTable("activity_logs", {
    id: uuid().defaultRandom().primaryKey(),
    actorId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
    clientId: uuid().notNull().references(() => client.id, { onDelete: "cascade" }),
    projectId: uuid().notNull().references(() => project.id, { onDelete: "cascade" }),
    action: activityActionEnum("action").notNull(),
    changes: jsonb("changes").$type<Record<string, { from: unknown; to: unknown }>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
    index("activity_logs_project_created_idx").on(table.projectId, table.createdAt.desc()),
    index("activity_logs_client_created_idx").on(table.clientId, table.createdAt.desc()),
    index("activity_logs_created_at_idx").on(table.createdAt.desc()),
]);