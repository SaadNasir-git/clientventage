import { db } from "@/db";
import { project, projectActivityLog } from "@/db/schema";
import { updateProjectSchema } from "@/db/validators";
import { getUser } from "@/lib/auth-helpers";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";

const idSchema = z.uuid()
type RouteCtx = { params: Promise<{ id: string }> };

const getProjectId = async (ctx: RouteCtx) => {
    const parsed = idSchema.safeParse((await ctx.params).id);
    return parsed.success ? { projectId: parsed.data } : { error: parsed.error };
}

const isNullCondition = isNull(project.deletedAt);

/**
 * GET /api/projects/[id]
 * Fetch a single project by id.
 *
 * Auth: required | Params: id (uuid) | Returns: 200 Project | Errors: 400/500
 */
export async function GET(_: Request, ctx: RouteCtx) {
    try {
        const { projectId, error } = await getProjectId(ctx);
        if (error) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

        const [result] = await db.select()
            .from(project)
            .where(and(eq(project.id, projectId), isNullCondition));

        if (!result) {
            return NextResponse.json({
                message: "Project not found"
            }, { status: 404 })
        }

        return NextResponse.json({ ...result });
    } catch {
        return NextResponse.json({
            message: "Something went wrong!"
        }, { status: 500 })
    }
}


/**
 * DELETE /api/projects/[id]
 * Delete a project and log PROJECT_DELETED.
 *
 * Auth: required | Params: id (uuid) | Returns: 204 | Errors: 400/404/500
 */
export async function DELETE(_: Request, ctx: RouteCtx) {
    try {
        const { projectId, error } = await getProjectId(ctx);
        if (error) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

        const actor = await getUser();

        const result = await db.transaction(async (tx) => {
            const [projectData] = await tx.select({
                clientId: project.clientId,
            }).from(project)
                .where(eq(project.id, projectId))

            if (!projectData) return;

            const [deletedProject] = await tx
                .update(project)
                .set({
                    deletedAt: new Date()
                })
                .where(and(eq(project.id, projectId), isNullCondition))
                .returning({ id: project.id });

            if (!deletedProject) return null;

            await tx.insert(projectActivityLog).values({
                actorId: actor.id,
                clientId: projectData.clientId,
                projectId,
                action: "PROJECT_DELETED",
            });

            return deletedProject.id;
        })

        if (!result) {
            return NextResponse.json({
                message: "Project Not Found"
            }, { status: 404 })
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({
            message: "Something went wrong!"
        }, { status: 500 })
    }
}


/**
 * PUT /api/projects/[id]
 * Update a project and log PROJECT_UPDATED with field-level changes.
 *
 * Auth: required | Params: id (uuid) | Body: updateProjectSchema | Returns: 200 { ok } | Errors: 400/404/500
 */
export async function PUT(request: Request, ctx: RouteCtx) {
    try {
        const { projectId, error } = await getProjectId(ctx)
        if (error) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

        const body = await request.json();
        const actor = await getUser();

        const parsed = await updateProjectSchema.safeParseAsync(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.message },
                { status: 400 }
            );
        }

        const { id, clientId, createdAt, updatedAt, ...payload } = parsed.data;

        // Strip null/undefined
        const correctEntries = Object.fromEntries(
            Object.entries(payload).filter(
                (entry): entry is [string, Exclude<typeof entry[1], null | undefined>] =>
                    entry[1] !== undefined && entry[1] !== null
            )
        );

        const [oldProjectData] = await db
            .select()
            .from(project)
            .where(and(eq(project.id, projectId),));

        if (!oldProjectData) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const normalized = (v: unknown) => v instanceof Date ? v.toISOString() : v;
        const changedEntries = Object.fromEntries(
            Object.entries(correctEntries).filter(([k, v]) => {
                const key = k as keyof typeof oldProjectData;
                return normalized(oldProjectData[key]) !== normalized(v);
            })
        );

        if (Object.keys(changedEntries).length === 0) {
            return NextResponse.json({ ok: true, unchanged: true });
        }

        const changes = Object.fromEntries(
            Object.entries(changedEntries).map(([key, to]) => [
                key,
                { from: normalized((oldProjectData as Record<string, unknown>)[key]), to: normalized(to) },
            ])
        );

        await db.transaction(async (tx) => {
            await tx
                .update(project)
                .set(changedEntries)
                .where(and(eq(project.id, projectId), isNullCondition));

            await tx.insert(projectActivityLog).values({
                actorId: actor.id,
                clientId: oldProjectData.clientId,
                projectId,
                action: "PROJECT_UPDATED",
                changes
            });
        });

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({
            message: "Something went wrong!"
        }, { status: 500 })
    }
}