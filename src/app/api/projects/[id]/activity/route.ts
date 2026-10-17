import { db } from "@/db";
import { projectActivityLog, user } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const uuid = z.uuid();

const changeMapSchema = z.record(
  z.string(),
  z.object({ from: z.unknown(), to: z.unknown() }),
);


/**
 * GET /api/projects/[id]/activity
 * List activity logs for a project, newest first (max 100).
 *
 * Auth: required | Params: id (uuid) | Returns: 200 { logs } | Errors: 400/500
 */
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  if (!uuid.safeParse(projectId).success) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  try {
    const logs = await db
      .select({
        id: projectActivityLog.id,
        actorName: user.name,
        createdAt: projectActivityLog.createdAt,
        changes: projectActivityLog.changes,
      })
      .from(projectActivityLog)
      .innerJoin(user, eq(user.id, projectActivityLog.actorId))
      .where(eq(projectActivityLog.projectId, projectId))
      .orderBy(desc(projectActivityLog.createdAt), desc(projectActivityLog.id))
      .limit(100);

    const enhancedLogs = logs.map((log) => {
      const parsed = changeMapSchema.safeParse(log.changes);
      return {
        id: log.id,
        createdAt: log.createdAt,
        actorName: log.actorName,
        changes: parsed.success
          ? Object.entries(parsed.data).map(([name, v]) => ({
              name,
              from: v.from,
              to: v.to,
            }))
          : [],
      };
    });

    return NextResponse.json({ logs: enhancedLogs });
  } catch (error) {
    console.error("GET /projects/[id]/activity failed:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}