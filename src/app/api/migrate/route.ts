import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getAuthUser } from '@/lib/auth';
import { DEFAULT_ACCOUNTS } from '@/lib/accounting';

function getDbClient() {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!dbUrl) return null;
  return neon(dbUrl);
}

const MIGRATION_SQL = `
-- ===========================
-- Billu Accounting Migration
-- ===========================

-- Add new columns to existing tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_price NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS opening_stock NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock NUMERIC;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS journal_entry_id TEXT;

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT DEFAULT '',
  city TEXT,
  state TEXT,
  pincode TEXT,
  gstin TEXT,
  pan TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  parent_id TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Journal Entries (double-entry accounting)
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  date TEXT NOT NULL,
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  narration TEXT,
  financial_year TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Journal Lines (debit/credit lines)
CREATE TABLE IF NOT EXISTS journal_lines (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  description TEXT
);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  purchase_number TEXT NOT NULL,
  date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  supplier_data JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  discount_type TEXT DEFAULT 'percent',
  discount_value NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  tax_type TEXT DEFAULT 'GST_INTRA_STATE',
  tax_amount NUMERIC DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  round_off NUMERIC DEFAULT 0,
  grand_total NUMERIC NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  journal_entry_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  gst_applicable BOOLEAN DEFAULT FALSE,
  gst_rate NUMERIC,
  gst_amount NUMERIC DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  payment_mode TEXT DEFAULT 'Cash',
  payment_account TEXT DEFAULT 'Cash',
  vendor TEXT,
  attachment_url TEXT,
  notes TEXT,
  journal_entry_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Receipts (Money In)
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  receipt_number TEXT NOT NULL,
  date TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  reference_type TEXT DEFAULT 'INVOICE',
  reference_id TEXT,
  party_id TEXT,
  party_name TEXT,
  payment_mode TEXT DEFAULT 'Cash',
  payment_account TEXT DEFAULT 'Cash',
  description TEXT,
  notes TEXT,
  journal_entry_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments (Money Out)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  payment_number TEXT NOT NULL,
  date TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  reference_type TEXT DEFAULT 'PURCHASE',
  reference_id TEXT,
  party_id TEXT,
  party_name TEXT,
  payment_mode TEXT DEFAULT 'Cash',
  payment_account TEXT DEFAULT 'Cash',
  description TEXT,
  notes TEXT,
  journal_entry_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Credit Notes
CREATE TABLE IF NOT EXISTS credit_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  credit_note_number TEXT NOT NULL,
  date TEXT NOT NULL,
  invoice_id TEXT,
  client_id TEXT NOT NULL,
  client_data JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  tax_amount NUMERIC DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  grand_total NUMERIC NOT NULL,
  reason TEXT,
  notes TEXT,
  journal_entry_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Debit Notes
CREATE TABLE IF NOT EXISTS debit_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  debit_note_number TEXT NOT NULL,
  date TEXT NOT NULL,
  purchase_id TEXT,
  supplier_id TEXT NOT NULL,
  supplier_data JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  tax_amount NUMERIC DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  grand_total NUMERIC NOT NULL,
  reason TEXT,
  notes TEXT,
  journal_entry_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payment History (partial payments tracking)
CREATE TABLE IF NOT EXISTS payment_history (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  date TEXT NOT NULL,
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_mode TEXT DEFAULT 'Cash',
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  account_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stock Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  product_id TEXT NOT NULL,
  product_name TEXT,
  date TEXT NOT NULL,
  quantity_change NUMERIC NOT NULL,
  reason TEXT,
  notes TEXT,
  journal_entry_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Financial Years
CREATE TABLE IF NOT EXISTS financial_years (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_user ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(user_id, code);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_ref ON journal_entries(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_fy ON journal_entries(financial_year);
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_user ON credit_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_debit_notes_user ON debit_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_ref ON payment_history(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product ON stock_adjustments(product_id);
`;

/**
 * POST /api/migrate — Run database migration for accounting tables
 */
export async function POST(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getDbClient();
  if (!sql) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    // Run migration (all statements use IF NOT EXISTS / IF NOT EXISTS)
    await (sql as any).unsafe(MIGRATION_SQL);

    // Check if user already has accounts seeded
    const existingAccounts = await sql`
      SELECT COUNT(*) as count FROM accounts WHERE user_id = ${authUser.id}
    `;

    const accountCount = Number(existingAccounts[0]?.count || 0);

    if (accountCount === 0) {
      // Seed default chart of accounts for this user
      for (const acct of DEFAULT_ACCOUNTS) {
        const id = `acct-${acct.code}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        await sql`
          INSERT INTO accounts (id, user_id, name, code, type, is_system, description)
          VALUES (${id}, ${authUser.id}, ${acct.name}, ${acct.code}, ${acct.type}, ${acct.isSystem}, ${acct.description || null})
          ON CONFLICT (id) DO NOTHING
        `;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      accountsSeeded: accountCount === 0,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Migration error:', errorMsg);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

/**
 * GET /api/migrate — Check migration status
 */
export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getDbClient();
  if (!sql) {
    return NextResponse.json({ migrated: false, reason: 'Database not configured' });
  }

  try {
    // Check if accounts table exists and has data for this user
    const result = await sql`
      SELECT COUNT(*) as count FROM accounts WHERE user_id = ${authUser.id}
    `;
    const accountCount = Number(result[0]?.count || 0);

    return NextResponse.json({
      migrated: accountCount > 0,
      accountCount,
    });
  } catch {
    return NextResponse.json({ migrated: false, reason: 'Tables not yet created' });
  }
}
