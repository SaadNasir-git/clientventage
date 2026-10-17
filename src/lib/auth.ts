import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from '@/db/schema/index'

export const auth = betterAuth({
    user: {
        additionalFields: {
            role: {
                type: ["admin", "employee", "user"],
                required: false,
                defaultValue: "user",
                input: false
            }
        }
    },
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false
    }
});