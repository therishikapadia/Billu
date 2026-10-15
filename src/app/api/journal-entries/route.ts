import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getAuthUser } from '@/lib/auth';

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
    const entries = await sql`
      SELECT * FROM journal_entries WHERE user_id = ${authUser.id} ORDER BY date DESC, created_at DESC
    `;

    if (entries.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const lines = await sql`
      SELECT jl.* FROM journal_lines jl
      JOIN journal_entries je ON jl.entry_id = je.id
      WHERE je.user_id = ${authUser.id}
    `;

    // Group lines by entry_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const linesByEntry = lines.reduce((acc: any, line: any) => {
      if (!acc[line.entry_id]) acc[line.entry_id] = [];
      acc[line.entry_id].push({
        id: line.id,
        entryId: line.entry_id,
        accountId: line.account_id,
        debit: Number(line.debit || 0),
        credit: Number(line.credit || 0),
        description: line.description || '',
      });
      return acc;
    }, {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = entries.map((e: any) => ({
      id: e.id,
      userId: e.user_id,
      date: e.date,
      referenceType: e.reference_type,
      referenceId: e.reference_id,
      narration: e.narration || '',
      financialYear: e.financial_year || '',
      lines: linesByEntry[e.id] || [],
      createdAt: e.created_at,
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
    const { id, date, referenceType, referenceId, narration, financialYear, lines } = body;

    if (!id || !date || !referenceType || !referenceId) {
      return NextResponse.json({ error: 'Missing journal entry fields' }, { status: 400 });
    }

    // Insert journal entry
    await sql`
      INSERT INTO journal_entries (id, user_id, date, reference_type, reference_id, narration, financial_year)
      VALUES (${id}, ${authUser.id}, ${date}, ${referenceType}, ${referenceId}, ${narration || null}, ${financialYear || null})
      ON CONFLICT (id) DO UPDATE SET
        date = EXCLUDED.date,
        reference_type = EXCLUDED.reference_type,
        reference_id = EXCLUDED.reference_id,
        narration = EXCLUDED.narration,
        financial_year = EXCLUDED.financial_year
      WHERE journal_entries.user_id = ${authUser.id}
    `;

    // Replace lines
    await sql`DELETE FROM journal_lines WHERE entry_id = ${id}`;

    if (Array.isArray(lines) && lines.length > 0) {
      for (const line of lines) {
        const lineId = line.id || `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        await sql`
          INSERT INTO journal_lines (id, entry_id, account_id, debit, credit, description)
          VALUES (${lineId}, ${id}, ${line.accountId}, ${line.debit || 0}, ${line.credit || 0}, ${line.description || null})
        `;
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
