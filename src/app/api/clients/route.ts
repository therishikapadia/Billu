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
    const rows = await sql`
      SELECT * FROM clients 
      WHERE user_id = ${authUser.id} 
      ORDER BY created_at DESC
    `;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = rows.map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      billingAddress: c.billing_address || '',
      shippingAddress: c.shipping_address || '',
      city: c.city || '',
      state: c.state || '',
      pincode: c.pincode || '',
      gstin: c.gstin || '',
      pan: c.pan || '',
      notes: c.notes || '',
      createdAt: c.created_at,
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
  if (!sql) return NextResponse.json({ message: 'Neon DB not configured', useLocal: true });

  try {
    const body = await request.json();
    const { id, name, phone, email, billingAddress, shippingAddress, city, state, pincode, gstin, pan, notes } = body;

    if (!id || !name || !phone) {
      return NextResponse.json({ error: 'Client name, phone and ID are required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO clients (
        id, user_id, name, phone, email, billing_address, shipping_address,
        city, state, pincode, gstin, pan, notes
      ) VALUES (
        ${id}, ${authUser.id}, ${name.trim()}, ${phone.trim()}, ${email || null}, ${billingAddress || ''},
        ${shippingAddress || null}, ${city || null}, ${state || null},
        ${pincode || null}, ${gstin || null}, ${pan || null}, ${notes || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        billing_address = EXCLUDED.billing_address,
        shipping_address = EXCLUDED.shipping_address,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        pincode = EXCLUDED.pincode,
        gstin = EXCLUDED.gstin,
        pan = EXCLUDED.pan,
        notes = EXCLUDED.notes
      WHERE clients.user_id = ${authUser.id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Client not found or access denied.' }, { status: 403 });
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
  if (!sql) return NextResponse.json({ message: 'Neon DB not configured', useLocal: true });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const result = await sql`
      DELETE FROM clients 
      WHERE id = ${id} AND user_id = ${authUser.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Client not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
