import { db } from '@/db';
import { client } from '@/db/schema';
import { insertClientSchema } from '@/db/validators';
import { isAdmin } from '@/src/lib/isAdmin';
import { and, ilike, isNull, or } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

const isNullCondition = isNull(client.deletedAt);

/**
 * POST /api/clients
 * Create a new client.
 *
 * Auth: required | Body: insertClientSchema | Returns: 201 { clientId } | Errors: 400/500
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const isOk = await isAdmin();

    if (!isOk) {
      return NextResponse.json({
        message: "User is not allowed!"
      })
    }

    const parsed = await insertClientSchema.safeParseAsync(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "parsed failed",
          details: parsed.error.message
        },
        { status: 400 }
      );
    }
    const payload = parsed.data;

    const [result] = await db.insert(client)
      .values({
        name: payload.name,
        email: payload.email,
        phone: payload.phone ?? null,
        address: payload.address ?? null,
        company: payload.company ?? null,
        notes: payload.notes ?? null
      }).returning({
        clientId: client.id
      })

    return NextResponse.json({ ...result }, {
      status: 201,
      headers: { Location: `/api/clients/${result.clientId}` },
    });
  } catch {
    return NextResponse.json({
      message: "Something went wrong"
    }, { status: 500 });
  }
}


/**
 * GET /api/clients
 * List clients, optionally filtered by search query.
 *
 * Auth: required | Query: query? | Returns: 200 Client[] | Errors: 500
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isOk = await isAdmin();

    if (!isOk) {
      return NextResponse.json({
        message: "User is not allowed!"
      })
    }
    const query = searchParams.get("query");

    const conditions = [];
    if (query && query.length > 2) {
      const escaped = query.replace(/[\\%_]/g, (c) => `\\${c}`);
      conditions.push(ilike(client.name, `%${escaped}%`), ilike(client.email, `%${escaped}%`), ilike(client.company, `%${escaped}%`));
    }

    const clients = await db.select().from(client).where(conditions.length ? and(or(...conditions), isNullCondition) : isNullCondition);
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({
      message: "Something went wrong"
    }, { status: 500 });
  }
}