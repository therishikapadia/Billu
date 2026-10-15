import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

export const AUTH_COOKIE_NAME = 'billu_auth_token';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'fallback_secret_for_billu_enterprise_jwt_2026';
  return new TextEncoder().encode(secret);
}

export interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
  companyName?: string;
}

/**
 * Securely hashes plain-text password using bcrypt with 10 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compares plain-text password with stored bcrypt hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Issues signed JWT session token valid for 7 days.
 */
export async function signAuthToken(user: AuthSessionUser): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({
    id: user.id,
    email: user.email.toLowerCase(),
    name: user.name,
    companyName: user.companyName || '',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

/**
 * Verifies JWT token and extracts session payload.
 */
export async function verifyAuthToken(token: string): Promise<AuthSessionUser | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    if (!payload || !payload.id || !payload.email) {
      return null;
    }
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name || ''),
      companyName: payload.companyName ? String(payload.companyName) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies auth token from request.
 * Supports both:
 * 1. Authorization: Bearer <token> header (Capacitor mobile & API clients)
 * 2. HTTP-only secure Cookie: billu_auth_token=<token> (Web browsers)
 */
export async function getAuthUser(request: Request): Promise<AuthSessionUser | null> {
  // 1. Check Bearer Authorization Header
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const user = await verifyAuthToken(token);
      if (user) return user;
    }
  }

  // 2. Check Cookie header
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
  if (match && match[1]) {
    const token = decodeURIComponent(match[1]);
    const user = await verifyAuthToken(token);
    if (user) return user;
  }

  return null;
}

/**
 * Email syntax validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Password strength and length validation
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
}

// In-Memory Rate Limiting for Auth Endpoints (mitigates brute-force attacks)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Simple in-memory rate limiter for login/signup attempts.
 * Max `maxAttempts` per `windowSeconds`.
 */
export function checkRateLimit(key: string, maxAttempts = 10, windowSeconds = 600): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  // Periodic cleanup if store grows
  if (rateLimitStore.size > 1000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) rateLimitStore.delete(k);
    }
  }

  if (!existing || existing.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (existing.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: maxAttempts - existing.count };
}
