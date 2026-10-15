import { pgTable, text, numeric, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

// ========================
// EXISTING TABLES (preserved)
// ========================

export const usersTable = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  companyName: text('company_name'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const companySettingsTable = pgTable('company_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').unique(),
  name: text('name').notNull(),
  tagline: text('tagline').default(''),
  email: text('email').default(''),
  phone: text('phone').default(''),
  address: text('address').default(''),
  city: text('city').default(''),
  state: text('state').default(''),
  pincode: text('pincode').default(''),
  gstin: text('gstin').default(''),
  pan: text('pan').default(''),
  bankName: text('bank_name').default(''),
  accountNumber: text('account_number').default(''),
  ifsc: text('ifsc').default(''),
  upiId: text('upi_id').default(''),
  logoUrl: text('logo_url'),
  signatureUrl: text('signature_url'),
  terms: text('terms').default(''),
  notes: text('notes').default(''),
  currency: text('currency').default('INR'),
  currencySymbol: text('currency_symbol').default('₹'),
  taxType: text('tax_type').default('GST'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const clientsTable = pgTable('clients', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  billingAddress: text('billing_address').default(''),
  shippingAddress: text('shipping_address'),
  city: text('city'),
  state: text('state'),
  pincode: text('pincode'),
  gstin: text('gstin'),
  pan: text('pan'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const productsTable = pgTable('products', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  description: text('description'),
  hsn: text('hsn'),
  price: numeric('price').notNull(),
  unit: text('unit').default('pcs'),
  taxRate: numeric('tax_rate').default('18'),
  stock: numeric('stock'),
  purchasePrice: numeric('purchase_price'),
  openingStock: numeric('opening_stock'),
  minStock: numeric('min_stock'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const invoicesTable = pgTable('invoices', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  invoiceNumber: text('invoice_number').notNull(),
  date: text('date').notNull(),
  dueDate: text('due_date').notNull(),
  clientId: text('client_id').notNull(),
  clientData: jsonb('client_data').notNull(),
  items: jsonb('items').notNull(),
  subtotal: numeric('subtotal').notNull(),
  discountType: text('discount_type').default('percent'),
  discountValue: numeric('discount_value').default('0'),
  discountAmount: numeric('discount_amount').default('0'),
  taxType: text('tax_type').default('GST_INTRA_STATE'),
  taxAmount: numeric('tax_amount').default('0'),
  cgstAmount: numeric('cgst_amount').default('0'),
  sgstAmount: numeric('sgst_amount').default('0'),
  igstAmount: numeric('igst_amount').default('0'),
  roundOff: numeric('round_off').default('0'),
  grandTotal: numeric('grand_total').notNull(),
  notes: text('notes'),
  terms: text('terms'),
  signatureData: text('signature_data'),
  signatureType: text('signature_type'),
  signatoryName: text('signatory_name'),
  status: text('status').default('pending'),
  paymentReceivedDate: text('payment_received_date'),
  paymentMode: text('payment_mode'),
  amountPaid: numeric('amount_paid').default('0'),
  journalEntryId: text('journal_entry_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ========================
// NEW ACCOUNTING TABLES
// ========================

export const suppliersTable = pgTable('suppliers', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address').default(''),
  city: text('city'),
  state: text('state'),
  pincode: text('pincode'),
  gstin: text('gstin'),
  pan: text('pan'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const accountsTable = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  code: text('code').notNull(),
  type: text('type').notNull(), // ASSET, LIABILITY, INCOME, EXPENSE, EQUITY
  parentId: text('parent_id'),
  isSystem: boolean('is_system').default(false),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const journalEntriesTable = pgTable('journal_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  date: text('date').notNull(),
  referenceType: text('reference_type').notNull(),
  referenceId: text('reference_id').notNull(),
  narration: text('narration'),
  financialYear: text('financial_year'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const journalLinesTable = pgTable('journal_lines', {
  id: text('id').primaryKey(),
  entryId: text('entry_id').notNull(),
  accountId: text('account_id').notNull(),
  debit: numeric('debit').default('0'),
  credit: numeric('credit').default('0'),
  description: text('description'),
});

export const purchasesTable = pgTable('purchases', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  purchaseNumber: text('purchase_number').notNull(),
  date: text('date').notNull(),
  dueDate: text('due_date').notNull(),
  supplierId: text('supplier_id').notNull(),
  supplierData: jsonb('supplier_data').notNull(),
  items: jsonb('items').notNull(),
  subtotal: numeric('subtotal').notNull(),
  discountType: text('discount_type').default('percent'),
  discountValue: numeric('discount_value').default('0'),
  discountAmount: numeric('discount_amount').default('0'),
  taxType: text('tax_type').default('GST_INTRA_STATE'),
  taxAmount: numeric('tax_amount').default('0'),
  cgstAmount: numeric('cgst_amount').default('0'),
  sgstAmount: numeric('sgst_amount').default('0'),
  igstAmount: numeric('igst_amount').default('0'),
  roundOff: numeric('round_off').default('0'),
  grandTotal: numeric('grand_total').notNull(),
  amountPaid: numeric('amount_paid').default('0'),
  notes: text('notes'),
  status: text('status').default('pending'),
  journalEntryId: text('journal_entry_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const expensesTable = pgTable('expenses', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  date: text('date').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  amount: numeric('amount').notNull(),
  gstApplicable: boolean('gst_applicable').default(false),
  gstRate: numeric('gst_rate'),
  gstAmount: numeric('gst_amount').default('0'),
  cgstAmount: numeric('cgst_amount').default('0'),
  sgstAmount: numeric('sgst_amount').default('0'),
  igstAmount: numeric('igst_amount').default('0'),
  paymentMode: text('payment_mode').default('Cash'),
  paymentAccount: text('payment_account').default('Cash'),
  vendor: text('vendor'),
  attachmentUrl: text('attachment_url'),
  notes: text('notes'),
  journalEntryId: text('journal_entry_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const receiptsTable = pgTable('receipts', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  receiptNumber: text('receipt_number').notNull(),
  date: text('date').notNull(),
  amount: numeric('amount').notNull(),
  referenceType: text('reference_type').default('INVOICE'),
  referenceId: text('reference_id'),
  partyId: text('party_id'),
  partyName: text('party_name'),
  paymentMode: text('payment_mode').default('Cash'),
  paymentAccount: text('payment_account').default('Cash'),
  description: text('description'),
  notes: text('notes'),
  journalEntryId: text('journal_entry_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const paymentsTable = pgTable('payments', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  paymentNumber: text('payment_number').notNull(),
  date: text('date').notNull(),
  amount: numeric('amount').notNull(),
  referenceType: text('reference_type').default('PURCHASE'),
  referenceId: text('reference_id'),
  partyId: text('party_id'),
  partyName: text('party_name'),
  paymentMode: text('payment_mode').default('Cash'),
  paymentAccount: text('payment_account').default('Cash'),
  description: text('description'),
  notes: text('notes'),
  journalEntryId: text('journal_entry_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const creditNotesTable = pgTable('credit_notes', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  creditNoteNumber: text('credit_note_number').notNull(),
  date: text('date').notNull(),
  invoiceId: text('invoice_id'),
  clientId: text('client_id').notNull(),
  clientData: jsonb('client_data').notNull(),
  items: jsonb('items').notNull(),
  subtotal: numeric('subtotal').notNull(),
  taxAmount: numeric('tax_amount').default('0'),
  cgstAmount: numeric('cgst_amount').default('0'),
  sgstAmount: numeric('sgst_amount').default('0'),
  igstAmount: numeric('igst_amount').default('0'),
  grandTotal: numeric('grand_total').notNull(),
  reason: text('reason'),
  notes: text('notes'),
  journalEntryId: text('journal_entry_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const debitNotesTable = pgTable('debit_notes', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  debitNoteNumber: text('debit_note_number').notNull(),
  date: text('date').notNull(),
  purchaseId: text('purchase_id'),
  supplierId: text('supplier_id').notNull(),
  supplierData: jsonb('supplier_data').notNull(),
  items: jsonb('items').notNull(),
  subtotal: numeric('subtotal').notNull(),
  taxAmount: numeric('tax_amount').default('0'),
  cgstAmount: numeric('cgst_amount').default('0'),
  sgstAmount: numeric('sgst_amount').default('0'),
  igstAmount: numeric('igst_amount').default('0'),
  grandTotal: numeric('grand_total').notNull(),
  reason: text('reason'),
  notes: text('notes'),
  journalEntryId: text('journal_entry_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const paymentHistoryTable = pgTable('payment_history', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  date: text('date').notNull(),
  referenceType: text('reference_type').notNull(), // INVOICE or PURCHASE
  referenceId: text('reference_id').notNull(),
  amount: numeric('amount').notNull(),
  paymentMode: text('payment_mode').default('Cash'),
  transactionId: text('transaction_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const expenseCategoriesTable = pgTable('expense_categories', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  isDefault: boolean('is_default').default(false),
  accountId: text('account_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const stockAdjustmentsTable = pgTable('stock_adjustments', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  productId: text('product_id').notNull(),
  productName: text('product_name'),
  date: text('date').notNull(),
  quantityChange: numeric('quantity_change').notNull(),
  reason: text('reason'),
  notes: text('notes'),
  journalEntryId: text('journal_entry_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const financialYearsTable = pgTable('financial_years', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});
