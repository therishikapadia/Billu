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
      SELECT * FROM expenses WHERE user_id = ${authUser.id} ORDER BY date DESC, created_at DESC
    `;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = rows.map((e: any) => ({
      id: e.id,
      userId: e.user_id,
      date: e.date,
      category: e.category,
      description: e.description || '',
      amount: Number(e.amount),
      gstApplicable: Boolean(e.gst_applicable),
      gstRate: e.gst_rate ? Number(e.gst_rate) : undefined,
      gstAmount: Number(e.gst_amount || 0),
      cgstAmount: Number(e.cgst_amount || 0),
      sgstAmount: Number(e.sgst_amount || 0),
      igstAmount: Number(e.igst_amount || 0),
      paymentMode: e.payment_mode || 'Cash',
      paymentAccount: e.payment_account || 'Cash',
      vendor: e.vendor || '',
      attachmentUrl: e.attachment_url || undefined,
      notes: e.notes || '',
      journalEntryId: e.journal_entry_id || undefined,
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
    const {
      id,
      date,
      category,
      description,
      amount,
      gstApplicable,
      gstRate,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      paymentMode,
      paymentAccount,
      vendor,
      attachmentUrl,
      notes,
      journalEntryId,
    } = body;

    if (!id || !date || !category || amount === undefined) {
      return NextResponse.json({ error: 'Missing required expense fields' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO expenses (
        id, user_id, date, category, description, amount, gst_applicable, gst_rate,
        gst_amount, cgst_amount, sgst_amount, igst_amount, payment_mode, payment_account,
        vendor, attachment_url, notes, journal_entry_id
      )
      VALUES (
        ${id}, ${authUser.id}, ${date}, ${category}, ${description || ''}, ${amount},
        ${gstApplicable || false}, ${gstRate || null}, ${gstAmount || 0}, ${cgstAmount || 0},
        ${sgstAmount || 0}, ${igstAmount || 0}, ${paymentMode || 'Cash'}, ${paymentAccount || 'Cash'},
        ${vendor || null}, ${attachmentUrl || null}, ${notes || null}, ${journalEntryId || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        date = EXCLUDED.date,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        amount = EXCLUDED.amount,
        gst_applicable = EXCLUDED.gst_applicable,
        gst_rate = EXCLUDED.gst_rate,
        gst_amount = EXCLUDED.gst_amount,
        cgst_amount = EXCLUDED.cgst_amount,
        sgst_amount = EXCLUDED.sgst_amount,
        igst_amount = EXCLUDED.igst_amount,
        payment_mode = EXCLUDED.payment_mode,
        payment_account = EXCLUDED.payment_account,
        vendor = EXCLUDED.vendor,
        attachment_url = EXCLUDED.attachment_url,
        notes = EXCLUDED.notes,
        journal_entry_id = EXCLUDED.journal_entry_id
      WHERE expenses.user_id = ${authUser.id}
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
    return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });
  }

  const sql = getDbClient();
  if (!sql) return NextResponse.json({ message: 'DB not configured', useLocal: true });

  try {
    await sql`
      DELETE FROM expenses WHERE id = ${id} AND user_id = ${authUser.id}
    `;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
