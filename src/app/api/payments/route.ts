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
    const rows = await sql`
      SELECT * FROM payments WHERE user_id = ${authUser.id} ORDER BY date DESC, created_at DESC
    `;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = rows.map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      paymentNumber: p.payment_number,
      date: p.date,
      amount: Number(p.amount),
      referenceType: p.reference_type || 'PURCHASE',
      referenceId: p.reference_id || undefined,
      partyId: p.party_id || undefined,
      partyName: p.party_name || '',
      paymentMode: p.payment_mode || 'Cash',
      paymentAccount: p.payment_account || 'Cash',
      description: p.description || '',
      notes: p.notes || '',
      journalEntryId: p.journal_entry_id || undefined,
      createdAt: p.created_at,
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
    const {
      id,
      paymentNumber,
      date,
      amount,
      referenceType,
      referenceId,
      partyId,
      partyName,
      paymentMode,
      paymentAccount,
      description,
      notes,
      journalEntryId,
    } = body;

    if (!id || !paymentNumber || !date || amount === undefined) {
      return NextResponse.json({ error: 'Missing required payment fields' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO payments (
        id, user_id, payment_number, date, amount, reference_type, reference_id,
        party_id, party_name, payment_mode, payment_account, description, notes, journal_entry_id
      )
      VALUES (
        ${id}, ${authUser.id}, ${paymentNumber}, ${date}, ${amount}, ${referenceType || 'PURCHASE'},
        ${referenceId || null}, ${partyId || null}, ${partyName || null}, ${paymentMode || 'Cash'},
        ${paymentAccount || 'Cash'}, ${description || null}, ${notes || null}, ${journalEntryId || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        payment_number = EXCLUDED.payment_number,
        date = EXCLUDED.date,
        amount = EXCLUDED.amount,
        reference_type = EXCLUDED.reference_type,
        reference_id = EXCLUDED.reference_id,
        party_id = EXCLUDED.party_id,
        party_name = EXCLUDED.party_name,
        payment_mode = EXCLUDED.payment_mode,
        payment_account = EXCLUDED.payment_account,
        description = EXCLUDED.description,
        notes = EXCLUDED.notes,
        journal_entry_id = EXCLUDED.journal_entry_id
      WHERE payments.user_id = ${authUser.id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
  }

  const sql = getDbClient();
  if (!sql) return NextResponse.json({ message: 'DB not configured', useLocal: true });

  try {
    await sql`
      DELETE FROM payments WHERE id = ${id} AND user_id = ${authUser.id}
    `;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
