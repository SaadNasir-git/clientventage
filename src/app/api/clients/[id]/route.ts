import { db } from "@/db";
import { client, project } from "@/db/schema";
import { updateClientSchema } from "@/db/validators";
import { isAdmin } from "@/src/lib/isAdmin";
import { and, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const idSchema = z.uuid();

type RouteCtx = { params: Promise<{ id: string }> };

async function getClientId(ctx: RouteCtx) {
    const parsed = idSchema.safeParse((await ctx.params).id);
    return parsed.success ? { clientId: parsed.data } : { error: parsed.error };
}
const isNullCondition = isNull(client.deletedAt)


/**
 * GET /api/clients/[id]
 * Fetch a single client by id.
 *
 * Auth: required | Params: id (uuid) | Returns: 200 Client | Errors: 400/404/500
 */
export async function GET(_: NextRequest, ctx: RouteCtx) {
    const { clientId, error } = await getClientId(ctx);
    const isOk = await isAdmin();

    if (!isOk) {
        return NextResponse.json({
            message: "Forbidden"
        },{ status: 409 })
    }

    if (error) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

    try {
        const [row] = await db.select().from(client)
            .where(and(eq(client.id, clientId), isNullCondition));
        if (!row) return NextResponse.json({ message: "Client not found" }, { status: 404 });
        return NextResponse.json(row);
    } catch (err) {
        console.error("GET /clients/[id] failed:", err);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}


/**
 * PATCH /api/clients/[id]
 * Partially update a client.
 *
 * Auth: required | Params: id (uuid) | Body: updateClientSchema | Returns: 200 Client | Errors: 400/404/500
 */
export async function PATCH(request: NextRequest, ctx: RouteCtx) {
    const { clientId, error } = await getClientId(ctx);
    const isOk = await isAdmin();

    if (!isOk) {
        return NextResponse.json({
            message: "Forbidden"
        },{ status: 409 })
    }

    if (error) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

    const body = await request.json();

    const parsed = updateClientSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { message: "Validation failed", details: parsed.error.message },
            { status: 400 },
        );
    }

    const { id: _ignored, createdAt, updatedAt, ...updates } = parsed.data;
    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    try {
        const [updated] = await db.update(client)
            .set(updates)
            .where(and(eq(client.id, clientId), isNullCondition))
            .returning();

        if (!updated) return NextResponse.json({ message: "Client not found" }, { status: 404 });
        return NextResponse.json(updated);
    } catch (err) {
        console.error("PATCH /clients/[id] failed:", err);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}


/**
 * DELETE /api/clients/[id]
 * Delete a client by id.
 *
 * Auth: required | Params: id (uuid) | Returns: 204 | Errors: 400/404/500
 */
export async function DELETE(_: NextRequest, ctx: RouteCtx) {
    const { clientId, error } = await getClientId(ctx);
    const isOk = await isAdmin();

    if (!isOk) {
        return NextResponse.json({
            message: "Forbidden"
        },{ status: 409 })
    }
    
    if (error) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

    try {
        const projects = await db.select({
            id: project.id
        }).from(project)
            .where(and(eq(project.clientId, clientId), isNull(project.deletedAt)));

        if (projects.length > 0) {
            throw new Error();
        }

        const deleted = await db.
            update(client)
            .set({
                deletedAt: new Date()
            })
            .where(and(eq(client.id, clientId), isNullCondition))
            .returning({ id: client.id });

        if (deleted.length === 0) {
            return NextResponse.json({ message: "Client not found" }, { status: 404 });
        }
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        console.error("DELETE /clients/[id] failed:", err);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}