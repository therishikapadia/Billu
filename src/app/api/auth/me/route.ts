import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';

function getDbClient() {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!dbUrl) return null;
  return neon(dbUrl);
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const sql = getDbClient();
    if (!sql) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: authUser.id,
          email: authUser.email,
          name: authUser.name,
          companyName: authUser.companyName || '',
        },
      });
    }

    const users = await sql`
      SELECT id, email, name, company_name, created_at
      FROM users
      WHERE id = ${authUser.id}
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = users[0];
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.company_name || '',
        createdAt: user.created_at,
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Session verify error:', errorMsg);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
