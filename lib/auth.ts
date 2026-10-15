import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";

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
        provider: "pg"
    }),
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        }
    }
});