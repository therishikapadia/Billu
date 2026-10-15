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
    return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
  }

  const sql = getDbClient();
  if (!sql) {
    return NextResponse.json({ message: 'Neon DB not configured', useLocal: true });
  }

  try {
    const rows = await sql`
      SELECT * FROM invoices 
      WHERE user_id = ${authUser.id} 
      ORDER BY created_at DESC
    `;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      invoiceNumber: r.invoice_number,
      date: r.date,
      dueDate: r.due_date,
      clientId: r.client_id,
      clientData: typeof r.client_data === 'string' ? JSON.parse(r.client_data) : r.client_data,
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
      notes: r.notes || '',
      terms: r.terms || '',
      signatureData: r.signature_data,
      signatureType: r.signature_type,
      signatoryName: r.signatory_name,
      status: r.status,
      paymentReceivedDate: r.payment_received_date,
      paymentMode: r.payment_mode,
      createdAt: r.created_at,
    }));

    return NextResponse.json(
      { success: true, data: formatted },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
  }

  const sql = getDbClient();
  if (!sql) {
    return NextResponse.json({ message: 'Neon DB not configured', useLocal: true });
  }

  try {
    const body = await request.json();
    const {
      id, invoiceNumber, date, dueDate, clientId, clientData,
      items, subtotal, discountType, discountValue, discountAmount,
      taxType, taxAmount, cgstAmount, sgstAmount, igstAmount,
      roundOff, grandTotal, notes, terms, signatureData, signatureType,
      signatoryName, status, paymentReceivedDate, paymentMode
    } = body;

    if (!id || !invoiceNumber || !date || !dueDate) {
      return NextResponse.json({ error: 'Missing required invoice fields' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO invoices (
        id, user_id, invoice_number, date, due_date, client_id, client_data,
        items, subtotal, discount_type, discount_value, discount_amount,
        tax_type, tax_amount, cgst_amount, sgst_amount, igst_amount,
        round_off, grand_total, notes, terms, signature_data, signature_type,
        signatory_name, status, payment_received_date, payment_mode
      ) VALUES (
        ${id}, ${authUser.id}, ${invoiceNumber}, ${date}, ${dueDate}, ${clientId || ''}, ${JSON.stringify(clientData || {})},
        ${JSON.stringify(items || [])}, ${subtotal || 0}, ${discountType || 'percent'}, ${discountValue || 0}, ${discountAmount || 0},
        ${taxType || 'GST_INTRA_STATE'}, ${taxAmount || 0}, ${cgstAmount || 0}, ${sgstAmount || 0}, ${igstAmount || 0},
        ${roundOff || 0}, ${grandTotal || 0}, ${notes || ''}, ${terms || ''}, ${signatureData || null}, ${signatureType || null},
        ${signatoryName || null}, ${status || 'pending'}, ${paymentReceivedDate || null}, ${paymentMode || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        invoice_number = EXCLUDED.invoice_number,
        date = EXCLUDED.date,
        due_date = EXCLUDED.due_date,
        client_data = EXCLUDED.client_data,
        items = EXCLUDED.items,
        subtotal = EXCLUDED.subtotal,
        discount_amount = EXCLUDED.discount_amount,
        tax_amount = EXCLUDED.tax_amount,
        grand_total = EXCLUDED.grand_total,
        notes = EXCLUDED.notes,
        terms = EXCLUDED.terms,
        signature_data = EXCLUDED.signature_data,
        signature_type = EXCLUDED.signature_type,
        signatory_name = EXCLUDED.signatory_name,
        status = EXCLUDED.status,
        payment_received_date = EXCLUDED.payment_received_date,
        payment_mode = EXCLUDED.payment_mode
      WHERE invoices.user_id = ${authUser.id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Invoice not found or access denied.' }, { status: 403 });
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
    return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
  }

  const sql = getDbClient();
  if (!sql) {
    return NextResponse.json({ message: 'Neon DB not configured', useLocal: true });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const result = await sql`
      DELETE FROM invoices 
      WHERE id = ${id} AND user_id = ${authUser.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Invoice not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
