import { pgTable, pgEnum, uuid, varchar, text, date, timestamp } from "drizzle-orm/pg-core";
import { client } from "./client";

export const projectStatusEnum = pgEnum("project_status", [
    "PLANNING",
    "IN_PROGRESS",
    "REVIEW",
    "COMPLETED"
]);

export const projectPriorityEnum = pgEnum("project_priority", [
    "LOW",
    "MEDIUM",
    "HIGH"
]);

export const project = pgTable("project", {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").notNull().references(() => client.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    status: projectStatusEnum("status").default("PLANNING").notNull(),
    priority: projectPriorityEnum("priority").default("MEDIUM").notNull(),
    startDate: date("start_date", { mode: "string", }).notNull(),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});