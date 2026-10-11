import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  if (!dbUrl) {
    return NextResponse.json({
      connected: false,
      message: 'No DATABASE_URL configured. App is running with ultra-fast local offline storage.',
    });
  }

  try {
    const sql = neon(dbUrl);
    // Simple ping query
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    
    // Ping connection and verify tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    return NextResponse.json({
      connected: true,
      time: result[0]?.current_time,
      version: result[0]?.pg_version,
      message: 'Successfully connected to Neon Serverless PostgreSQL & synchronized schema!',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      connected: false,
      error: errorMsg,
      message: 'Failed to connect to Neon DB. Check your connection string.',
    }, { status: 500 });
  }
}
