import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { client } from "./client";
import { project } from "./project";

export const activityActionEnum = pgEnum("activity_action", [
    "CLIENT_CREATED",
    "CLIENT_UPDATED",
    "CLIENT_DELETED",
    "PROJECT_CREATED",
    "PROJECT_UPDATED",
    "PROJECT_DELETED",
    "PROJECT_STATUS_CHANGED",
    "PROJECT_PRIORITY_CHANGED"
]);

export const activityLog = pgTable("activity_logs", {
    id: uuid().defaultRandom().primaryKey(),
    actorId: text().notNull().references(() => user.id, { onDelete: "restrict" }),
    clientId: uuid().references(() => client.id, { onDelete: "set null" }),
    projectId: uuid().references(() => project.id, { onDelete: "set null" }),
    action: activityActionEnum("action").notNull(),
    description: text("description").notNull(),
    changes: jsonb("changes").$type<Record<string, { from: unknown; to: unknown }>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
},
    (table) => [
        index("activity_logs_created_at_idx").on(table.createdAt),
        index("activity_logs_project_id_idx").on(table.projectId),
        index("activity_logs_client_id_idx").on(table.clientId),
    ],
);