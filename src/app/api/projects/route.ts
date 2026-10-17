import { db } from "@/db";
import { projectActivityLog, project } from "@/db/schema";
import { insertProjectSchema } from "@/db/validators";
import { getUser } from "@/lib/auth-helpers";
import { and, asc, eq, ilike, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const uuid = z.uuid();
const isNullCondition = isNull(project.deletedAt)

/**
 * POST /api/projects
 * Create a project and log PROJECT_CREATED.
 *
 * Auth: required | Body: insertProjectSchema | Returns: 201 Project | Errors: 400/500
 */
export async function POST(request: Request) {
  const actor = await getUser();

  const body = await request.json()

  const parsed = insertProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", details: parsed.error.message },
      { status: 400 },
    );
  }
  const payload = parsed.data;

  try {
    const created = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(project)
        .values({
          title: payload.title,
          description: payload.description,
          clientId: payload.clientId,
          startDate: payload.startDate,
          dueDate: payload.dueDate,
          status: payload.status ?? undefined,
          priority: payload.priority ?? undefined,
        })
        .returning();

      await tx.insert(projectActivityLog).values({
        action: "PROJECT_CREATED",
        actorId: actor.id,
        clientId: payload.clientId,
        projectId: row.id,
      });

      return row;
    });

    return NextResponse.json(created, {
      status: 201,
      headers: { Location: `/api/projects/${created.id}` },
    });
  } catch (error) {
    console.error("POST /projects failed:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}


/**
 * GET /api/projects
 * List projects, optionally filtered by clientId or title search.
 *
 * Auth: required | Query: clientId?, query? | Returns: 200 Project[] | Errors: 400/500
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientIdParam = searchParams.get("clientId");
  const query = searchParams.get("query");

  let clientId: string | undefined;
  if (clientIdParam) {
    const check = uuid.safeParse(clientIdParam);
    if (!check.success) {
      return NextResponse.json({ message: "Invalid clientId" }, { status: 400 });
    }
    clientId = check.data;
  }

  if (query && query.length > 200) {
    return NextResponse.json({ message: "query too long" }, { status: 400 });
  }

  const priorityOrder = sql`case ${project.priority}
    when 'HIGH' then 1 when 'MEDIUM' then 2 when 'LOW' then 3 else 4 end`;

  const conditions = [];
  if (clientId) conditions.push(eq(project.clientId, clientId));
  if (query && query.length > 2) {
    const escaped = query.replace(/[\\%_]/g, (c) => `\\${c}`);
    conditions.push(ilike(project.title, `%${escaped}%`));
  }

  try {
    const projects = await db
      .select()
      .from(project)
      .where(conditions.length ? and(...conditions, isNullCondition) : isNullCondition)
      .orderBy(priorityOrder, asc(project.dueDate))

    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /projects failed:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}