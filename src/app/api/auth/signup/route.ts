import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import {
  hashPassword,
  signAuthToken,
  isValidEmail,
  validatePassword,
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
    const rateCheck = checkRateLimit(`signup_${ip}`, 10, 600);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password, name, companyName } = body;

    // Validation
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    const cleanCompanyName = (companyName || '').trim();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!cleanName) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
    }

    const sql = getDbClient();
    if (!sql) {
      return NextResponse.json({ error: 'Database is not configured' }, { status: 500 });
    }

    // Check if user already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${cleanEmail} LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }

    // Hash password and insert
    const passwordHash = await hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const users = await sql`
      INSERT INTO users (
        id, email, password_hash, name, company_name
      ) VALUES (
        ${userId}, ${cleanEmail}, ${passwordHash}, ${cleanName}, ${cleanCompanyName || null}
      )
      RETURNING id, email, name, company_name, created_at
    `;

    const newUser = users[0];

    // Seed default company profile for this user
    await sql`
      INSERT INTO company_settings (
        id, user_id, name, tagline, email, phone, currency, currency_symbol, tax_type
      ) VALUES (
        ${userId}, ${userId}, ${cleanCompanyName || `${cleanName}'s Business`},
        'Smart Billing & Invoicing', ${cleanEmail}, '', 'INR', '₹', 'GST'
      )
      ON CONFLICT (user_id) DO NOTHING
    `;

    const token = await signAuthToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      companyName: newUser.company_name || undefined,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        companyName: newUser.company_name || '',
        createdAt: newUser.created_at,
      },
      token,
    });

    // Set secure HTTP-only cookie
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
    console.error('Signup error:', errorMsg);
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }
}
