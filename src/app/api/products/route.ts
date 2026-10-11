import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

function getDbClient() {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!dbUrl) return null;
  return neon(dbUrl);
}

export async function GET() {
  const sql = getDbClient();
  if (!sql) return NextResponse.json({ message: 'Neon DB not configured', useLocal: true });

  try {
    const rows = await sql`SELECT * FROM products ORDER BY created_at DESC`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = rows.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      hsn: p.hsn || '',
      price: Number(p.price),
      unit: p.unit || 'pcs',
      taxRate: Number(p.tax_rate ?? 18),
      stock: p.stock !== null && p.stock !== undefined ? Number(p.stock) : undefined,
      createdAt: p.created_at,
    }));
    return NextResponse.json(
      { success: true, data: formatted },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const sql = getDbClient();
  if (!sql) return NextResponse.json({ message: 'Neon DB not configured', useLocal: true });

  try {
    const body = await request.json();
    const { id, name, description, hsn, price, unit, taxRate, stock } = body;

    const result = await sql`
      INSERT INTO products (
        id, name, description, hsn, price, unit, tax_rate, stock
      ) VALUES (
        ${id}, ${name}, ${description || null}, ${hsn || null},
        ${price}, ${unit || 'pcs'}, ${taxRate || 18}, ${stock || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        hsn = EXCLUDED.hsn,
        price = EXCLUDED.price,
        unit = EXCLUDED.unit,
        tax_rate = EXCLUDED.tax_rate,
        stock = EXCLUDED.stock
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const sql = getDbClient();
  if (!sql) return NextResponse.json({ message: 'Neon DB not configured', useLocal: true });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await sql`DELETE FROM products WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
