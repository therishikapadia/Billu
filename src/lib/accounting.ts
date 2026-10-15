/**
 * Billu Accounting Engine
 *
 * Core double-entry accounting logic. All functions are pure — they create
 * journal entry objects without performing any I/O. The caller persists
 * entries via storage/API.
 *
 * Accounting rule enforced: TOTAL DEBITS = TOTAL CREDITS for every entry.
 */

import {
  Account,
  JournalEntry,
  JournalLine,
  Invoice,
  Purchase,
  Expense,
  Receipt,
  Payment,
  CreditNote,
  DebitNote,
  ReferenceType,
} from './types';
import { getFinancialYear } from './utils';

// ========================
// DEFAULT CHART OF ACCOUNTS
// ========================

export interface DefaultAccount {
  name: string;
  code: string;
  type: Account['type'];
  isSystem: boolean;
  description?: string;
}

export const DEFAULT_ACCOUNTS: DefaultAccount[] = [
  // ASSETS
  { name: 'Cash', code: '1000', type: 'ASSET', isSystem: true, description: 'Cash in hand' },
  { name: 'Bank', code: '1001', type: 'ASSET', isSystem: true, description: 'Bank account balance' },
  { name: 'Accounts Receivable', code: '1100', type: 'ASSET', isSystem: true, description: 'Money owed by customers' },
  { name: 'Inventory', code: '1200', type: 'ASSET', isSystem: true, description: 'Stock/inventory value' },
  { name: 'Input CGST', code: '1300', type: 'ASSET', isSystem: true, description: 'CGST paid on purchases' },
  { name: 'Input SGST', code: '1301', type: 'ASSET', isSystem: true, description: 'SGST paid on purchases' },
  { name: 'Input IGST', code: '1302', type: 'ASSET', isSystem: true, description: 'IGST paid on purchases' },

  // LIABILITIES
  { name: 'Accounts Payable', code: '2000', type: 'LIABILITY', isSystem: true, description: 'Money owed to suppliers' },
  { name: 'Output CGST', code: '2100', type: 'LIABILITY', isSystem: true, description: 'CGST collected on sales' },
  { name: 'Output SGST', code: '2101', type: 'LIABILITY', isSystem: true, description: 'SGST collected on sales' },
  { name: 'Output IGST', code: '2102', type: 'LIABILITY', isSystem: true, description: 'IGST collected on sales' },
  { name: 'Loans', code: '2200', type: 'LIABILITY', isSystem: true, description: 'Loans and borrowings' },

  // INCOME
  { name: 'Sales', code: '3000', type: 'INCOME', isSystem: true, description: 'Revenue from sales' },
  { name: 'Other Income', code: '3100', type: 'INCOME', isSystem: true, description: 'Miscellaneous income' },

  // EXPENSES
  { name: 'Purchases', code: '4000', type: 'EXPENSE', isSystem: true, description: 'Cost of goods purchased' },
  { name: 'Rent', code: '4100', type: 'EXPENSE', isSystem: true, description: 'Office/shop rent' },
  { name: 'Electricity', code: '4101', type: 'EXPENSE', isSystem: true, description: 'Electricity bills' },
  { name: 'Salary', code: '4102', type: 'EXPENSE', isSystem: true, description: 'Employee salaries' },
  { name: 'Transport', code: '4103', type: 'EXPENSE', isSystem: true, description: 'Transportation costs' },
  { name: 'Telephone / Internet', code: '4104', type: 'EXPENSE', isSystem: true, description: 'Phone and internet bills' },
  { name: 'Office Expenses', code: '4105', type: 'EXPENSE', isSystem: true, description: 'General office expenses' },
  { name: 'Repairs', code: '4106', type: 'EXPENSE', isSystem: true, description: 'Repairs and maintenance' },
  { name: 'Marketing', code: '4107', type: 'EXPENSE', isSystem: true, description: 'Advertising and marketing' },
  { name: 'Professional Fees', code: '4108', type: 'EXPENSE', isSystem: true, description: 'CA, legal, consulting fees' },
  { name: 'Bank Charges', code: '4109', type: 'EXPENSE', isSystem: true, description: 'Bank service charges' },
  { name: 'Other Expenses', code: '4199', type: 'EXPENSE', isSystem: true, description: 'Miscellaneous expenses' },

  // EQUITY
  { name: 'Capital', code: '5000', type: 'EQUITY', isSystem: true, description: 'Owner investment' },
  { name: 'Drawings', code: '5100', type: 'EQUITY', isSystem: true, description: 'Owner withdrawals' },
];

// ========================
// HELPER FUNCTIONS
// ========================

function findAccountByCode(accounts: Account[], code: string): Account | undefined {
  return accounts.find((a) => a.code === code);
}

function findExpenseAccount(accounts: Account[], category: string): Account | undefined {
  // Map expense categories to account codes
  const categoryToCode: Record<string, string> = {
    'Rent': '4100',
    'Electricity': '4101',
    'Salary': '4102',
    'Transport': '4103',
    'Telephone / Internet': '4104',
    'Office Expenses': '4105',
    'Repairs': '4106',
    'Marketing': '4107',
    'Professional Fees': '4108',
    'Bank Charges': '4109',
    'Miscellaneous': '4199',
  };
  const code = categoryToCode[category] || '4199';
  return findAccountByCode(accounts, code);
}

function getPaymentAccountCode(paymentAccount: string): string {
  switch (paymentAccount?.toLowerCase()) {
    case 'bank':
      return '1001';
    case 'cash':
    default:
      return '1000';
  }
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createLine(
  entryId: string,
  accountId: string,
  debit: number,
  credit: number,
  description?: string
): JournalLine {
  return {
    id: generateId('jl'),
    entryId,
    accountId,
    debit: Math.round(debit * 100) / 100,
    credit: Math.round(credit * 100) / 100,
    description,
  };
}

// ========================
// JOURNAL ENTRY CREATION
// ========================

/**
 * Create a balanced journal entry. Validates that total debits = total credits.
 */
export function createJournalEntry(
  date: string,
  referenceType: ReferenceType,
  referenceId: string,
  narration: string,
  lines: JournalLine[],
  userId?: string
): JournalEntry {
  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

  // Allow tiny floating-point tolerance
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    console.error(`Unbalanced entry: Debit=${totalDebit}, Credit=${totalCredit}, Diff=${totalDebit - totalCredit}`);
    throw new Error(
      `Journal entry is unbalanced. Debit: ₹${totalDebit.toFixed(2)}, Credit: ₹${totalCredit.toFixed(2)}`
    );
  }

  const entryId = generateId('je');
  const linesWithEntryId = lines.map((l) => ({ ...l, entryId }));

  return {
    id: entryId,
    userId,
    date,
    referenceType,
    referenceId,
    narration,
    financialYear: getFinancialYear(date),
    lines: linesWithEntryId,
    createdAt: new Date().toISOString(),
  };
}

// ========================
// SALES INVOICE POSTING
// Dr Accounts Receivable (grandTotal)
// Cr Sales (taxable amount)
// Cr Output CGST/SGST/IGST
// ========================

export function createSalesInvoiceEntry(
  invoice: Invoice,
  accounts: Account[],
  userId?: string
): JournalEntry {
  const receivables = findAccountByCode(accounts, '1100');
  const sales = findAccountByCode(accounts, '3000');
  const outputCGST = findAccountByCode(accounts, '2100');
  const outputSGST = findAccountByCode(accounts, '2101');
  const outputIGST = findAccountByCode(accounts, '2102');

  if (!receivables || !sales) {
    throw new Error('Required accounts not found (Accounts Receivable, Sales)');
  }

  const entryId = generateId('je');
  const taxableAmount = invoice.subtotal - (invoice.discountAmount || 0);
  const lines: JournalLine[] = [];

  // Debit: Accounts Receivable = grandTotal
  lines.push(createLine(entryId, receivables.id, invoice.grandTotal, 0, `Invoice ${invoice.invoiceNumber}`));

  // Credit: Sales = taxable amount
  lines.push(createLine(entryId, sales.id, 0, taxableAmount, `Sales - ${invoice.invoiceNumber}`));

  // Credit: GST accounts
  if (invoice.cgstAmount && invoice.cgstAmount > 0 && outputCGST) {
    lines.push(createLine(entryId, outputCGST.id, 0, invoice.cgstAmount, `CGST on ${invoice.invoiceNumber}`));
  }
  if (invoice.sgstAmount && invoice.sgstAmount > 0 && outputSGST) {
    lines.push(createLine(entryId, outputSGST.id, 0, invoice.sgstAmount, `SGST on ${invoice.invoiceNumber}`));
  }
  if (invoice.igstAmount && invoice.igstAmount > 0 && outputIGST) {
    lines.push(createLine(entryId, outputIGST.id, 0, invoice.igstAmount, `IGST on ${invoice.invoiceNumber}`));
  }

  // Handle round-off
  if (invoice.roundOff && Math.abs(invoice.roundOff) > 0.001) {
    const roundOffAccount = findAccountByCode(accounts, '4199'); // Other Expenses
    if (roundOffAccount) {
      if (invoice.roundOff > 0) {
        // Round up means we charge more → debit receivables more, or adjust
        lines.push(createLine(entryId, roundOffAccount.id, 0, invoice.roundOff, 'Round-off'));
      } else {
        lines.push(createLine(entryId, roundOffAccount.id, Math.abs(invoice.roundOff), 0, 'Round-off'));
      }
    }
  }

  return createJournalEntry(
    invoice.date,
    'SALES_INVOICE',
    invoice.id,
    `Sales Invoice ${invoice.invoiceNumber} to ${invoice.client?.name || 'Customer'}`,
    lines,
    userId
  );
}

// ========================
// PURCHASE POSTING
// Dr Purchases (taxable amount)
// Dr Input CGST/SGST/IGST
// Cr Accounts Payable (grandTotal)
// ========================

export function createPurchaseEntry(
  purchase: Purchase,
  accounts: Account[],
  userId?: string
): JournalEntry {
  const purchases = findAccountByCode(accounts, '4000');
  const payable = findAccountByCode(accounts, '2000');
  const inputCGST = findAccountByCode(accounts, '1300');
  const inputSGST = findAccountByCode(accounts, '1301');
  const inputIGST = findAccountByCode(accounts, '1302');

  if (!purchases || !payable) {
    throw new Error('Required accounts not found (Purchases, Accounts Payable)');
  }

  const entryId = generateId('je');
  const taxableAmount = purchase.subtotal - (purchase.discountAmount || 0);
  const lines: JournalLine[] = [];

  // Debit: Purchases = taxable amount
  lines.push(createLine(entryId, purchases.id, taxableAmount, 0, `Purchase ${purchase.purchaseNumber}`));

  // Debit: Input GST accounts
  if (purchase.cgstAmount && purchase.cgstAmount > 0 && inputCGST) {
    lines.push(createLine(entryId, inputCGST.id, purchase.cgstAmount, 0, `Input CGST on ${purchase.purchaseNumber}`));
  }
  if (purchase.sgstAmount && purchase.sgstAmount > 0 && inputSGST) {
    lines.push(createLine(entryId, inputSGST.id, purchase.sgstAmount, 0, `Input SGST on ${purchase.purchaseNumber}`));
  }
  if (purchase.igstAmount && purchase.igstAmount > 0 && inputIGST) {
    lines.push(createLine(entryId, inputIGST.id, purchase.igstAmount, 0, `Input IGST on ${purchase.purchaseNumber}`));
  }

  // Credit: Accounts Payable = grandTotal
  lines.push(createLine(entryId, payable.id, 0, purchase.grandTotal, `Payable - ${purchase.purchaseNumber}`));

  // Handle round-off
  if (purchase.roundOff && Math.abs(purchase.roundOff) > 0.001) {
    const roundOffAccount = findAccountByCode(accounts, '4199');
    if (roundOffAccount) {
      if (purchase.roundOff > 0) {
        lines.push(createLine(entryId, roundOffAccount.id, purchase.roundOff, 0, 'Round-off'));
      } else {
        lines.push(createLine(entryId, roundOffAccount.id, 0, Math.abs(purchase.roundOff), 'Round-off'));
      }
    }
  }

  return createJournalEntry(
    purchase.date,
    'PURCHASE',
    purchase.id,
    `Purchase ${purchase.purchaseNumber} from ${purchase.supplier?.name || 'Supplier'}`,
    lines,
    userId
  );
}

// ========================
// RECEIPT POSTING (Money In)
// Dr Cash/Bank (amount)
// Cr Accounts Receivable (if against invoice)
// Cr Other Income (if other income)
// ========================

export function createReceiptEntry(
  receipt: Receipt,
  accounts: Account[],
  userId?: string
): JournalEntry {
  const cashBankCode = getPaymentAccountCode(receipt.paymentAccount);
  const cashBank = findAccountByCode(accounts, cashBankCode);

  if (!cashBank) {
    throw new Error('Payment account not found (Cash/Bank)');
  }

  const entryId = generateId('je');
  const lines: JournalLine[] = [];

  // Debit: Cash/Bank
  lines.push(createLine(entryId, cashBank.id, receipt.amount, 0, `Receipt ${receipt.receiptNumber}`));

  // Credit: Depends on reference type
  if (receipt.referenceType === 'INVOICE') {
    const receivables = findAccountByCode(accounts, '1100');
    if (!receivables) throw new Error('Accounts Receivable not found');
    lines.push(createLine(entryId, receivables.id, 0, receipt.amount, `Payment from ${receipt.partyName}`));
  } else {
    const otherIncome = findAccountByCode(accounts, '3100');
    if (!otherIncome) throw new Error('Other Income account not found');
    lines.push(createLine(entryId, otherIncome.id, 0, receipt.amount, receipt.description || 'Other Income'));
  }

  return createJournalEntry(
    receipt.date,
    'RECEIPT',
    receipt.id,
    `Receipt ${receipt.receiptNumber} from ${receipt.partyName}`,
    lines,
    userId
  );
}

// ========================
// PAYMENT POSTING (Money Out)
// Dr Accounts Payable (if against purchase)
// Dr Expense account (if expense)
// Cr Cash/Bank (amount)
// ========================

export function createPaymentEntry(
  payment: Payment,
  accounts: Account[],
  userId?: string
): JournalEntry {
  const cashBankCode = getPaymentAccountCode(payment.paymentAccount);
  const cashBank = findAccountByCode(accounts, cashBankCode);

  if (!cashBank) {
    throw new Error('Payment account not found (Cash/Bank)');
  }

  const entryId = generateId('je');
  const lines: JournalLine[] = [];

  // Debit: Depends on reference type
  if (payment.referenceType === 'PURCHASE') {
    const payable = findAccountByCode(accounts, '2000');
    if (!payable) throw new Error('Accounts Payable not found');
    lines.push(createLine(entryId, payable.id, payment.amount, 0, `Payment to ${payment.partyName}`));
  } else {
    const otherExpenses = findAccountByCode(accounts, '4199');
    if (!otherExpenses) throw new Error('Expense account not found');
    lines.push(createLine(entryId, otherExpenses.id, payment.amount, 0, payment.description || 'Payment'));
  }

  // Credit: Cash/Bank
  lines.push(createLine(entryId, cashBank.id, 0, payment.amount, `Payment ${payment.paymentNumber}`));

  return createJournalEntry(
    payment.date,
    'PAYMENT',
    payment.id,
    `Payment ${payment.paymentNumber} to ${payment.partyName}`,
    lines,
    userId
  );
}

// ========================
// EXPENSE POSTING
// Dr Expense account (amount excluding reclaimable GST)
// Dr Input CGST/SGST/IGST (if GST applicable)
// Cr Cash/Bank (total amount including GST)
// ========================

export function createExpenseEntry(
  expense: Expense,
  accounts: Account[],
  userId?: string
): JournalEntry {
  const cashBankCode = getPaymentAccountCode(expense.paymentAccount);
  const cashBank = findAccountByCode(accounts, cashBankCode);
  const expenseAccount = findExpenseAccount(accounts, expense.category);

  if (!cashBank || !expenseAccount) {
    throw new Error('Required accounts not found for expense');
  }

  const entryId = generateId('je');
  const lines: JournalLine[] = [];

  // Debit: Expense account (base amount without GST)
  const baseAmount = expense.amount - (expense.gstAmount || 0);
  lines.push(createLine(entryId, expenseAccount.id, baseAmount, 0, expense.description || expense.category));

  // Debit: Input GST (if applicable)
  if (expense.gstApplicable && expense.gstAmount > 0) {
    if (expense.cgstAmount > 0) {
      const inputCGST = findAccountByCode(accounts, '1300');
      if (inputCGST) lines.push(createLine(entryId, inputCGST.id, expense.cgstAmount, 0, 'Input CGST'));
    }
    if (expense.sgstAmount > 0) {
      const inputSGST = findAccountByCode(accounts, '1301');
      if (inputSGST) lines.push(createLine(entryId, inputSGST.id, expense.sgstAmount, 0, 'Input SGST'));
    }
    if (expense.igstAmount && expense.igstAmount > 0) {
      const inputIGST = findAccountByCode(accounts, '1302');
      if (inputIGST) lines.push(createLine(entryId, inputIGST.id, expense.igstAmount, 0, 'Input IGST'));
    }
  }

  // Credit: Cash/Bank (total amount including GST)
  lines.push(createLine(entryId, cashBank.id, 0, expense.amount, `Expense - ${expense.category}`));

  return createJournalEntry(
    expense.date,
    'EXPENSE',
    expense.id,
    `Expense: ${expense.category} - ${expense.description || ''}`.trim(),
    lines,
    userId
  );
}

// ========================
// CREDIT NOTE POSTING (Reverses Sales)
// Dr Sales / Output GST
// Cr Accounts Receivable
// ========================

export function createCreditNoteEntry(
  creditNote: CreditNote,
  accounts: Account[],
  userId?: string
): JournalEntry {
  const receivables = findAccountByCode(accounts, '1100');
  const sales = findAccountByCode(accounts, '3000');

  if (!receivables || !sales) {
    throw new Error('Required accounts not found for credit note');
  }

  const entryId = generateId('je');
  const lines: JournalLine[] = [];

  const taxableAmount = creditNote.subtotal;

  // Debit: Sales (reverse the sale)
  lines.push(createLine(entryId, sales.id, taxableAmount, 0, `Credit Note ${creditNote.creditNoteNumber}`));

  // Debit: Output GST (reverse GST)
  if (creditNote.cgstAmount > 0) {
    const outputCGST = findAccountByCode(accounts, '2100');
    if (outputCGST) lines.push(createLine(entryId, outputCGST.id, creditNote.cgstAmount, 0, 'Reverse CGST'));
  }
  if (creditNote.sgstAmount > 0) {
    const outputSGST = findAccountByCode(accounts, '2101');
    if (outputSGST) lines.push(createLine(entryId, outputSGST.id, creditNote.sgstAmount, 0, 'Reverse SGST'));
  }
  if (creditNote.igstAmount > 0) {
    const outputIGST = findAccountByCode(accounts, '2102');
    if (outputIGST) lines.push(createLine(entryId, outputIGST.id, creditNote.igstAmount, 0, 'Reverse IGST'));
  }

  // Credit: Accounts Receivable
  lines.push(createLine(entryId, receivables.id, 0, creditNote.grandTotal, `CN to ${creditNote.client?.name}`));

  return createJournalEntry(
    creditNote.date,
    'CREDIT_NOTE',
    creditNote.id,
    `Credit Note ${creditNote.creditNoteNumber} for ${creditNote.client?.name || 'Customer'}`,
    lines,
    userId
  );
}

// ========================
// DEBIT NOTE POSTING (Reverses Purchase)
// Dr Accounts Payable
// Cr Purchases / Input GST
// ========================

export function createDebitNoteEntry(
  debitNote: DebitNote,
  accounts: Account[],
  userId?: string
): JournalEntry {
  const payable = findAccountByCode(accounts, '2000');
  const purchasesAccount = findAccountByCode(accounts, '4000');

  if (!payable || !purchasesAccount) {
    throw new Error('Required accounts not found for debit note');
  }

  const entryId = generateId('je');
  const lines: JournalLine[] = [];

  // Debit: Accounts Payable (reduce what we owe)
  lines.push(createLine(entryId, payable.id, debitNote.grandTotal, 0, `DN to ${debitNote.supplier?.name}`));

  const taxableAmount = debitNote.subtotal;

  // Credit: Purchases (reverse the purchase)
  lines.push(createLine(entryId, purchasesAccount.id, 0, taxableAmount, `Debit Note ${debitNote.debitNoteNumber}`));

  // Credit: Input GST (reverse GST credit)
  if (debitNote.cgstAmount > 0) {
    const inputCGST = findAccountByCode(accounts, '1300');
    if (inputCGST) lines.push(createLine(entryId, inputCGST.id, 0, debitNote.cgstAmount, 'Reverse Input CGST'));
  }
  if (debitNote.sgstAmount > 0) {
    const inputSGST = findAccountByCode(accounts, '1301');
    if (inputSGST) lines.push(createLine(entryId, inputSGST.id, 0, debitNote.sgstAmount, 'Reverse Input SGST'));
  }
  if (debitNote.igstAmount > 0) {
    const inputIGST = findAccountByCode(accounts, '1302');
    if (inputIGST) lines.push(createLine(entryId, inputIGST.id, 0, debitNote.igstAmount, 'Reverse Input IGST'));
  }

  return createJournalEntry(
    debitNote.date,
    'DEBIT_NOTE',
    debitNote.id,
    `Debit Note ${debitNote.debitNoteNumber} for ${debitNote.supplier?.name || 'Supplier'}`,
    lines,
    userId
  );
}

// ========================
// REPORT COMPUTATION
// ========================

/**
 * Compute Trial Balance from journal entries.
 * Returns { accountId, accountName, accountCode, type, debit, credit } for each account.
 */
export function computeTrialBalance(
  entries: JournalEntry[],
  accounts: Account[]
): Array<{
  accountId: string;
  accountName: string;
  accountCode: string;
  type: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}> {
  const balances = new Map<string, { debit: number; credit: number }>();

  for (const entry of entries) {
    for (const line of entry.lines) {
      const existing = balances.get(line.accountId) || { debit: 0, credit: 0 };
      existing.debit += line.debit;
      existing.credit += line.credit;
      balances.set(line.accountId, existing);
    }
  }

  const result = [];
  for (const account of accounts) {
    const bal = balances.get(account.id);
    if (bal && (bal.debit > 0 || bal.credit > 0)) {
      result.push({
        accountId: account.id,
        accountName: account.name,
        accountCode: account.code,
        type: account.type,
        totalDebit: Math.round(bal.debit * 100) / 100,
        totalCredit: Math.round(bal.credit * 100) / 100,
        balance: Math.round((bal.debit - bal.credit) * 100) / 100,
      });
    }
  }

  // Sort by account code
  result.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  return result;
}

/**
 * Compute Profit & Loss from trial balance data.
 */
export function computeProfitAndLoss(
  entries: JournalEntry[],
  accounts: Account[]
): {
  revenue: Array<{ name: string; amount: number }>;
  expenses: Array<{ name: string; amount: number }>;
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
} {
  const trial = computeTrialBalance(entries, accounts);

  const revenue: Array<{ name: string; amount: number }> = [];
  const expenses: Array<{ name: string; amount: number }> = [];

  for (const item of trial) {
    if (item.type === 'INCOME') {
      // Income accounts have credit balance
      revenue.push({ name: item.accountName, amount: item.totalCredit - item.totalDebit });
    } else if (item.type === 'EXPENSE') {
      // Expense accounts have debit balance
      expenses.push({ name: item.accountName, amount: item.totalDebit - item.totalCredit });
    }
  }

  const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const purchasesCOGS = expenses.find((e) => e.name === 'Purchases')?.amount || 0;
  const grossProfit = totalRevenue - purchasesCOGS;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    revenue,
    expenses,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    profitMargin: Math.round(profitMargin * 100) / 100,
  };
}

/**
 * Compute Balance Sheet from trial balance data.
 */
export function computeBalanceSheet(
  entries: JournalEntry[],
  accounts: Account[]
): {
  assets: Array<{ name: string; amount: number }>;
  liabilities: Array<{ name: string; amount: number }>;
  equity: Array<{ name: string; amount: number }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  netProfit: number;
} {
  const trial = computeTrialBalance(entries, accounts);
  const pnl = computeProfitAndLoss(entries, accounts);

  const assets: Array<{ name: string; amount: number }> = [];
  const liabilities: Array<{ name: string; amount: number }> = [];
  const equity: Array<{ name: string; amount: number }> = [];

  for (const item of trial) {
    if (item.type === 'ASSET') {
      const amount = item.totalDebit - item.totalCredit;
      if (Math.abs(amount) > 0.01) {
        assets.push({ name: item.accountName, amount });
      }
    } else if (item.type === 'LIABILITY') {
      const amount = item.totalCredit - item.totalDebit;
      if (Math.abs(amount) > 0.01) {
        liabilities.push({ name: item.accountName, amount });
      }
    } else if (item.type === 'EQUITY') {
      const amount = item.totalCredit - item.totalDebit;
      if (Math.abs(amount) > 0.01) {
        equity.push({ name: item.accountName, amount });
      }
    }
  }

  // Add net profit to equity
  if (Math.abs(pnl.netProfit) > 0.01) {
    equity.push({ name: 'Retained Profit', amount: pnl.netProfit });
  }

  const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
  const totalEquity = equity.reduce((sum, e) => sum + e.amount, 0);

  return {
    assets,
    liabilities,
    equity,
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalLiabilities: Math.round(totalLiabilities * 100) / 100,
    totalEquity: Math.round(totalEquity * 100) / 100,
    netProfit: pnl.netProfit,
  };
}

/**
 * Compute ledger for a specific account.
 */
export function computeAccountLedger(
  accountId: string,
  entries: JournalEntry[],
  accounts: Account[]
): Array<{
  date: string;
  narration: string;
  referenceType: string;
  debit: number;
  credit: number;
  runningBalance: number;
}> {
  const account = accounts.find((a) => a.id === accountId);
  if (!account) return [];

  const ledgerLines: Array<{
    date: string;
    narration: string;
    referenceType: string;
    debit: number;
    credit: number;
    runningBalance: number;
  }> = [];

  let runningBalance = 0;

  // Collect all relevant lines sorted by date
  const relevantEntries = entries
    .filter((e) => e.lines.some((l) => l.accountId === accountId))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const entry of relevantEntries) {
    for (const line of entry.lines) {
      if (line.accountId === accountId) {
        // For ASSET/EXPENSE: debit increases, credit decreases
        // For LIABILITY/INCOME/EQUITY: credit increases, debit decreases
        if (['ASSET', 'EXPENSE'].includes(account.type)) {
          runningBalance += line.debit - line.credit;
        } else {
          runningBalance += line.credit - line.debit;
        }

        ledgerLines.push({
          date: entry.date,
          narration: entry.narration || line.description || '',
          referenceType: entry.referenceType,
          debit: line.debit,
          credit: line.credit,
          runningBalance: Math.round(runningBalance * 100) / 100,
        });
      }
    }
  }

  return ledgerLines;
}

/**
 * Compute GST summary from journal entries.
 */
export function computeGSTSummary(
  entries: JournalEntry[],
  accounts: Account[]
): {
  outputCGST: number;
  outputSGST: number;
  outputIGST: number;
  inputCGST: number;
  inputSGST: number;
  inputIGST: number;
  totalOutput: number;
  totalInput: number;
  netPayable: number;
} {
  const trial = computeTrialBalance(entries, accounts);

  const getBalance = (code: string): number => {
    const item = trial.find((t) => t.accountCode === code);
    if (!item) return 0;
    // Liabilities have credit balance, assets have debit balance
    if (item.type === 'LIABILITY') return item.totalCredit - item.totalDebit;
    if (item.type === 'ASSET') return item.totalDebit - item.totalCredit;
    return 0;
  };

  const outputCGST = getBalance('2100');
  const outputSGST = getBalance('2101');
  const outputIGST = getBalance('2102');
  const inputCGST = getBalance('1300');
  const inputSGST = getBalance('1301');
  const inputIGST = getBalance('1302');

  const totalOutput = outputCGST + outputSGST + outputIGST;
  const totalInput = inputCGST + inputSGST + inputIGST;
  const netPayable = totalOutput - totalInput;

  return {
    outputCGST: Math.round(outputCGST * 100) / 100,
    outputSGST: Math.round(outputSGST * 100) / 100,
    outputIGST: Math.round(outputIGST * 100) / 100,
    inputCGST: Math.round(inputCGST * 100) / 100,
    inputSGST: Math.round(inputSGST * 100) / 100,
    inputIGST: Math.round(inputIGST * 100) / 100,
    totalOutput: Math.round(totalOutput * 100) / 100,
    totalInput: Math.round(totalInput * 100) / 100,
    netPayable: Math.round(netPayable * 100) / 100,
  };
}

/**
 * Validate that all journal entries are balanced.
 * Returns true if debits equal credits across all entries.
 */
export function validateAllEntriesBalanced(entries: JournalEntry[]): {
  balanced: boolean;
  totalDebit: number;
  totalCredit: number;
  unbalancedEntries: string[];
} {
  let totalDebit = 0;
  let totalCredit = 0;
  const unbalancedEntries: string[] = [];

  for (const entry of entries) {
    let entryDebit = 0;
    let entryCredit = 0;
    for (const line of entry.lines) {
      entryDebit += line.debit;
      entryCredit += line.credit;
    }
    totalDebit += entryDebit;
    totalCredit += entryCredit;

    if (Math.abs(entryDebit - entryCredit) > 0.01) {
      unbalancedEntries.push(entry.id);
    }
  }

  return {
    balanced: Math.abs(totalDebit - totalCredit) < 0.01 && unbalancedEntries.length === 0,
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    unbalancedEntries,
  };
}

/**
 * Generate default accounts for a new user. Returns Account[] with generated IDs.
 */
export function generateDefaultAccounts(userId: string): Account[] {
  return DEFAULT_ACCOUNTS.map((acct) => ({
    id: `acct-${acct.code}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    name: acct.name,
    code: acct.code,
    type: acct.type,
    isSystem: acct.isSystem,
    description: acct.description,
    createdAt: new Date().toISOString(),
  }));
}
