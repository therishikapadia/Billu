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
  if (!sql) return NextResponse.json({ message: 'Neon DB not configured', useLocal: true });

  try {
    const rows = await sql`SELECT * FROM company_settings WHERE user_id = ${authUser.id} LIMIT 1`;
    const r = rows[0];
    if (!r) {
      return NextResponse.json({ success: true, data: null });
    }
    const formatted = {
      id: r.id,
      userId: r.user_id,
      name: r.name,
      tagline: r.tagline || '',
      email: r.email || '',
      phone: r.phone || '',
      address: r.address || '',
      city: r.city || '',
      state: r.state || '',
      pincode: r.pincode || '',
      gstin: r.gstin || '',
      pan: r.pan || '',
      bankName: r.bank_name || '',
      accountNumber: r.account_number || '',
      ifsc: r.ifsc || '',
      upiId: r.upi_id || '',
      logoUrl: r.logo_url || '',
      signatureUrl: r.signature_url || '',
      terms: r.terms || '',
      notes: r.notes || '',
      currency: r.currency || 'INR',
      currencySymbol: r.currency_symbol || '₹',
      taxType: r.tax_type || 'GST',
      updatedAt: r.updated_at,
    };
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
  if (!sql) return NextResponse.json({ message: 'Neon DB not configured', useLocal: true });

  try {
    const body = await request.json();
    const {
      name, tagline, email, phone, address, city, state, pincode,
      gstin, pan, bankName, accountNumber, ifsc, upiId,
      logoUrl, signatureUrl, terms, notes, currency, currencySymbol, taxType
    } = body;

    const result = await sql`
      INSERT INTO company_settings (
        id, user_id, name, tagline, email, phone, address, city, state, pincode,
        gstin, pan, bank_name, account_number, ifsc, upi_id,
        logo_url, signature_url, terms, notes, currency, currency_symbol, tax_type, updated_at
      ) VALUES (
        ${authUser.id}, ${authUser.id}, ${name}, ${tagline || ''}, ${email || ''}, ${phone || ''}, ${address || ''},
        ${city || ''}, ${state || ''}, ${pincode || ''}, ${gstin || ''}, ${pan || ''},
        ${bankName || ''}, ${accountNumber || ''}, ${ifsc || ''}, ${upiId || ''},
        ${logoUrl || null}, ${signatureUrl || null}, ${terms || ''}, ${notes || ''},
        ${currency || 'INR'}, ${currencySymbol || '₹'}, ${taxType || 'GST'}, NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        tagline = EXCLUDED.tagline,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        pincode = EXCLUDED.pincode,
        gstin = EXCLUDED.gstin,
        pan = EXCLUDED.pan,
        bank_name = EXCLUDED.bank_name,
        account_number = EXCLUDED.account_number,
        ifsc = EXCLUDED.ifsc,
        upi_id = EXCLUDED.upi_id,
        logo_url = EXCLUDED.logo_url,
        signature_url = EXCLUDED.signature_url,
        terms = EXCLUDED.terms,
        notes = EXCLUDED.notes,
        currency = EXCLUDED.currency,
        currency_symbol = EXCLUDED.currency_symbol,
        tax_type = EXCLUDED.tax_type,
        updated_at = NOW()
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
