import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import {
  comparePassword,
  signAuthToken,
  isValidEmail,
  checkRateLimit,
  AUTH_COOKIE_NAME,
} from '@/lib/auth';

function getDbClient() {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!dbUrl) return null;
  return neon(dbUrl);
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'default_client';
    const rateCheck = checkRateLimit(`login_${ip}`, 10, 600);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait 10 minutes before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail) || !password) {
      return NextResponse.json(
        { error: 'Please provide both a valid email and password.' },
        { status: 400 }
      );
    }

    const sql = getDbClient();
    if (!sql) {
      return NextResponse.json({ error: 'Database is not configured' }, { status: 500 });
    }

    const users = await sql`
      SELECT id, email, password_hash, name, company_name, created_at
      FROM users
      WHERE email = ${cleanEmail}
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const user = users[0];
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const token = await signAuthToken({
      id: user.id,
      email: user.email,
      name: user.name,
      companyName: user.company_name || undefined,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.company_name || '',
        createdAt: user.created_at,
      },
      token,
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Login error:', errorMsg);
    return NextResponse.json({ error: 'An unexpected error occurred during login.' }, { status: 500 });
  }
}
