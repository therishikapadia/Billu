export interface User {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
}

export interface CompanySettings {
  id: string;
  userId?: string;
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  pan: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
  logoUrl?: string;
  signatureUrl?: string;
  terms: string;
  notes: string;
  currency: string;
  currencySymbol: string;
  taxType: 'GST' | 'VAT' | 'SALES_TAX';
  updatedAt: string;
}

export interface Client {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  billingAddress: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  hsn?: string;
  price: number;
  unit: 'pcs' | 'kg' | 'm' | 'hrs' | 'box' | 'pkt' | 'set' | 'service';
  taxRate: number; // e.g. 0, 5, 12, 18, 28
  stock?: number;
  purchasePrice?: number;
  openingStock?: number;
  minStock?: number;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  hsn?: string;
  quantity: number;
  unit: string;
  price: number;
  discountPercent: number;
  taxRate: number;
  amount: number; // Calculated (qty * price * (1 - discount%))
  taxAmount: number; // Calculated
}

export interface Invoice {
  id: string;
  userId?: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  clientId: string;
  client: Client;
  items: InvoiceItem[];
  subtotal: number;
  discountType: 'percent' | 'flat';
  discountValue: number;
  discountAmount: number;
  taxType: 'GST_INTER_STATE' | 'GST_INTRA_STATE' | 'FLAT_TAX'; // CGST+SGST vs IGST
  taxAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  roundOff: number;
  grandTotal: number;
  notes?: string;
  terms?: string;
  signatureData?: string; // Base64 data URL
  signatureType?: 'drawn' | 'uploaded' | 'none';
  signatoryName?: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'partial';
  paymentReceivedDate?: string;
  paymentMode?: 'UPI' | 'Bank Transfer' | 'Cash' | 'Cheque';
  amountPaid?: number;
  journalEntryId?: string;
  createdAt: string;
}

// ========================
// ACCOUNTING SYSTEM TYPES
// ========================

export interface Supplier {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  notes?: string;
  createdAt: string;
}

export type AccountType = 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | 'EQUITY';

export interface Account {
  id: string;
  userId?: string;
  name: string;
  code: string;
  type: AccountType;
  parentId?: string;
  isSystem: boolean;
  description?: string;
  createdAt: string;
}

export type ReferenceType = 'SALES_INVOICE' | 'PURCHASE' | 'RECEIPT' | 'PAYMENT' | 'EXPENSE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'OPENING_BALANCE' | 'STOCK_ADJUSTMENT';

export interface JournalEntry {
  id: string;
  userId?: string;
  date: string;
  referenceType: ReferenceType;
  referenceId: string;
  narration: string;
  financialYear: string;
  lines: JournalLine[];
  createdAt: string;
}

export interface JournalLine {
  id: string;
  entryId: string;
  accountId: string;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface Purchase {
  id: string;
  userId?: string;
  purchaseNumber: string;
  date: string;
  dueDate: string;
  supplierId: string;
  supplier?: Supplier;
  supplierData?: Supplier;
  items: InvoiceItem[];
  subtotal: number;
  discountType: 'percent' | 'flat';
  discountValue: number;
  discountAmount: number;
  taxType: 'GST_INTER_STATE' | 'GST_INTRA_STATE' | 'FLAT_TAX';
  taxAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  roundOff: number;
  grandTotal: number;
  amountPaid: number;
  notes?: string;
  status: 'draft' | 'pending' | 'partial' | 'paid';
  journalEntryId?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId?: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  gstApplicable: boolean;
  gstRate?: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount?: number;
  paymentMode: string;
  paymentAccount: string;
  vendor?: string;
  attachmentUrl?: string;
  notes?: string;
  journalEntryId?: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  userId?: string;
  receiptNumber: string;
  date: string;
  amount: number;
  referenceType: 'INVOICE' | 'OTHER_INCOME' | 'GENERAL';
  referenceId?: string;
  partyId?: string;
  partyName: string;
  paymentMode: string;
  paymentAccount: string;
  description?: string;
  notes?: string;
  journalEntryId?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId?: string;
  paymentNumber: string;
  date: string;
  amount: number;
  referenceType: 'PURCHASE' | 'EXPENSE' | 'OTHER' | 'GENERAL';
  referenceId?: string;
  partyId?: string;
  partyName: string;
  paymentMode: string;
  paymentAccount: string;
  description?: string;
  notes?: string;
  journalEntryId?: string;
  createdAt: string;
}

export interface CreditNote {
  id: string;
  userId?: string;
  creditNoteNumber: string;
  date: string;
  invoiceId?: string;
  clientId: string;
  client: Client;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  reason: string;
  notes?: string;
  journalEntryId?: string;
  createdAt: string;
}

export interface DebitNote {
  id: string;
  userId?: string;
  debitNoteNumber: string;
  date: string;
  purchaseId?: string;
  supplierId: string;
  supplier: Supplier;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  reason: string;
  notes?: string;
  journalEntryId?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  userId?: string;
  date: string;
  referenceType: 'INVOICE' | 'PURCHASE';
  referenceId: string;
  amount: number;
  paymentMode: string;
  transactionId?: string;
  notes?: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  userId?: string;
  name: string;
  isDefault: boolean;
  accountId?: string;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  userId?: string;
  productId: string;
  productName?: string;
  date: string;
  quantityChange: number;
  reason: string;
  notes?: string;
  journalEntryId?: string;
  createdAt: string;
}

export interface FinancialYear {
  id: string;
  userId?: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

// Default expense categories
export const DEFAULT_EXPENSE_CATEGORIES = [
  'Rent', 'Electricity', 'Salary', 'Transport', 'Telephone / Internet',
  'Office Expenses', 'Repairs', 'Marketing', 'Professional Fees',
  'Bank Charges', 'Miscellaneous',
] as const;

// Payment modes
export const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other'] as const;

// Payment accounts
export const PAYMENT_ACCOUNTS = ['Cash', 'Bank'] as const;
