import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getAuthUser } from '@/lib/auth';
import { DEFAULT_ACCOUNTS } from '@/lib/accounting';

function getDbClient() {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!dbUrl) return null;
  return neon(dbUrl);
}

export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getDbClient();
  if (!sql) return NextResponse.json({ message: 'DB not configured', useLocal: true });

  try {
    const rows = await sql`
      SELECT * FROM accounts WHERE user_id = ${authUser.id} ORDER BY code ASC
    `;

    // Auto-seed default accounts if empty
    if (rows.length === 0) {
      for (const acct of DEFAULT_ACCOUNTS) {
        const id = `acct-${acct.code}-${authUser.id}`;
        await sql`
          INSERT INTO accounts (id, user_id, name, code, type, is_system, description)
          VALUES (${id}, ${authUser.id}, ${acct.name}, ${acct.code}, ${acct.type}, ${acct.isSystem}, ${acct.description || null})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      const seeded = await sql`
        SELECT * FROM accounts WHERE user_id = ${authUser.id} ORDER BY code ASC
      `;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted = seeded.map((a: any) => ({
        id: a.id,
        userId: a.user_id,
        name: a.name,
        code: a.code,
        type: a.type,
        parentId: a.parent_id || undefined,
        isSystem: Boolean(a.is_system),
        description: a.description || '',
        createdAt: a.created_at,
      }));
      return NextResponse.json({ success: true, data: formatted });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = rows.map((a: any) => ({
      id: a.id,
      userId: a.user_id,
      name: a.name,
      code: a.code,
      type: a.type,
      parentId: a.parent_id || undefined,
      isSystem: Boolean(a.is_system),
      description: a.description || '',
      createdAt: a.created_at,
    }));
    return NextResponse.json(
      { success: true, data: formatted },
      { headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' } }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getDbClient();
  if (!sql) return NextResponse.json({ message: 'DB not configured', useLocal: true });

  try {
    const body = await request.json();
    const { id, name, code, type, parentId, isSystem, description } = body;

    if (!id || !name || !code || !type) {
      return NextResponse.json({ error: 'Missing required account fields' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO accounts (id, user_id, name, code, type, parent_id, is_system, description)
      VALUES (${id}, ${authUser.id}, ${name}, ${code}, ${type}, ${parentId || null}, ${isSystem || false}, ${description || null})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        type = EXCLUDED.type,
        parent_id = EXCLUDED.parent_id,
        description = EXCLUDED.description
      WHERE accounts.user_id = ${authUser.id}
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
