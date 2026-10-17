import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const client = pgTable("clients", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    company: varchar("company", { length: 200 }),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    address: text("address"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true })
});