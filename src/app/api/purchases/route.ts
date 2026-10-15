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
      SELECT * FROM purchases WHERE user_id = ${authUser.id} ORDER BY created_at DESC
    `;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      purchaseNumber: r.purchase_number,
      date: r.date,
      dueDate: r.due_date,
      supplierId: r.supplier_id,
      supplier: typeof r.supplier_data === 'string' ? JSON.parse(r.supplier_data) : r.supplier_data,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
      subtotal: Number(r.subtotal),
      discountType: r.discount_type,
      discountValue: Number(r.discount_value),
      discountAmount: Number(r.discount_amount),
      taxType: r.tax_type,
      taxAmount: Number(r.tax_amount),
      cgstAmount: Number(r.cgst_amount),
      sgstAmount: Number(r.sgst_amount),
      igstAmount: Number(r.igst_amount),
      roundOff: Number(r.round_off),
      grandTotal: Number(r.grand_total),
      amountPaid: Number(r.amount_paid || 0),
      notes: r.notes || '',
      status: r.status,
      journalEntryId: r.journal_entry_id,
      createdAt: r.created_at,
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
      id, purchaseNumber, date, dueDate, supplierId, supplierData, supplier,
      items, subtotal, discountType, discountValue, discountAmount,
      taxType, taxAmount, cgstAmount, sgstAmount, igstAmount,
      roundOff, grandTotal, amountPaid, notes, status, journalEntryId,
    } = body;

    if (!id || !purchaseNumber || !date || !dueDate) {
      return NextResponse.json({ error: 'Missing required purchase fields' }, { status: 400 });
    }

    const supplierJson = JSON.stringify(supplierData || supplier || {});
    const itemsJson = JSON.stringify(items || []);

    const result = await sql`
      INSERT INTO purchases (
        id, user_id, purchase_number, date, due_date, supplier_id, supplier_data,
        items, subtotal, discount_type, discount_value, discount_amount,
        tax_type, tax_amount, cgst_amount, sgst_amount, igst_amount,
        round_off, grand_total, amount_paid, notes, status, journal_entry_id
      ) VALUES (
        ${id}, ${authUser.id}, ${purchaseNumber}, ${date}, ${dueDate}, ${supplierId || ''},
        ${supplierJson}::jsonb, ${itemsJson}::jsonb, ${subtotal || 0}, ${discountType || 'percent'},
        ${discountValue || 0}, ${discountAmount || 0}, ${taxType || 'GST_INTRA_STATE'},
        ${taxAmount || 0}, ${cgstAmount || 0}, ${sgstAmount || 0}, ${igstAmount || 0},
        ${roundOff || 0}, ${grandTotal || 0}, ${amountPaid || 0}, ${notes || ''}, ${status || 'pending'},
        ${journalEntryId || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        purchase_number = EXCLUDED.purchase_number,
        date = EXCLUDED.date, due_date = EXCLUDED.due_date,
        supplier_data = EXCLUDED.supplier_data, items = EXCLUDED.items,
        subtotal = EXCLUDED.subtotal, discount_amount = EXCLUDED.discount_amount,
        tax_amount = EXCLUDED.tax_amount, cgst_amount = EXCLUDED.cgst_amount,
        sgst_amount = EXCLUDED.sgst_amount, igst_amount = EXCLUDED.igst_amount,
        grand_total = EXCLUDED.grand_total, amount_paid = EXCLUDED.amount_paid,
        notes = EXCLUDED.notes, status = EXCLUDED.status,
        journal_entry_id = EXCLUDED.journal_entry_id
      WHERE purchases.user_id = ${authUser.id}
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

  const sql = getDbClient();
  if (!sql) return NextResponse.json({ message: 'DB not configured', useLocal: true });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const result = await sql`
      DELETE FROM purchases WHERE id = ${id} AND user_id = ${authUser.id} RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
