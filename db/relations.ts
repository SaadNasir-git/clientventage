import { relations } from "drizzle-orm/_relations";
import { account, session, user } from "./schema/auth";
import { client } from "./schema/client";
import { project } from "./schema/project";
import { activityLog } from "./schema/activityLog";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  activities: many(activityLog)
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id]
  })
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id]
  })
}));

export const clientRelations = relations(client, ({ many }) => ({
  projects: many(project),
  activities: many(activityLog)
}));

export const projectRelations = relations(project, ({ one, many }) => ({
  client: one(client, {
    fields: [project.clientId],
    references: [client.id],
  }),
  activities: many(activityLog)
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  actor: one(user, {
    fields: [activityLog.actorId],
    references: [user.id],
  }),
  client: one(client, {
    fields: [activityLog.clientId],
    references: [client.id],
  }),
  project: one(project, {
    fields: [activityLog.projectId],
    references: [project.id],
  })
}));