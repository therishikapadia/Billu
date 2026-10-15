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
      SELECT * FROM products 
      WHERE user_id = ${authUser.id} 
      ORDER BY created_at DESC
    `;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = rows.map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      name: p.name,
      description: p.description || '',
      hsn: p.hsn || '',
      price: Number(p.price),
      unit: p.unit || 'pcs',
      taxRate: Number(p.tax_rate ?? 18),
      stock: p.stock !== null && p.stock !== undefined ? Number(p.stock) : undefined,
      purchasePrice: p.purchase_price !== null && p.purchase_price !== undefined ? Number(p.purchase_price) : undefined,
      openingStock: p.opening_stock !== null && p.opening_stock !== undefined ? Number(p.opening_stock) : undefined,
      minStock: p.min_stock !== null && p.min_stock !== undefined ? Number(p.min_stock) : undefined,
      createdAt: p.created_at,
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
    const { id, name, description, hsn, price, unit, taxRate, stock, purchasePrice, openingStock, minStock } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Product name and ID are required' }, { status: 400 });
    }

    const safePrice = Math.max(0, Number(price) || 0);
    const safeTax = Math.max(0, Number(taxRate) || 0);

    const result = await sql`
      INSERT INTO products (
        id, user_id, name, description, hsn, price, unit, tax_rate, stock,
        purchase_price, opening_stock, min_stock
      ) VALUES (
        ${id}, ${authUser.id}, ${name.trim()}, ${description || null}, ${hsn || null},
        ${safePrice}, ${unit || 'pcs'}, ${safeTax}, ${stock !== undefined && stock !== null ? Number(stock) : null},
        ${purchasePrice !== undefined && purchasePrice !== null ? Number(purchasePrice) : null},
        ${openingStock !== undefined && openingStock !== null ? Number(openingStock) : null},
        ${minStock !== undefined && minStock !== null ? Number(minStock) : null}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        hsn = EXCLUDED.hsn,
        price = EXCLUDED.price,
        unit = EXCLUDED.unit,
        tax_rate = EXCLUDED.tax_rate,
        stock = EXCLUDED.stock,
        purchase_price = EXCLUDED.purchase_price,
        opening_stock = EXCLUDED.opening_stock,
        min_stock = EXCLUDED.min_stock
      WHERE products.user_id = ${authUser.id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Product not found or access denied.' }, { status: 403 });
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
      DELETE FROM products 
      WHERE id = ${id} AND user_id = ${authUser.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Product not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
