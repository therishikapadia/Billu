/**
 * Billu Accounting Storage
 *
 * Client-side localStorage layer for accounting entities.
 * Follows the same pattern as the existing StorageService.
 * Each entity type has get/save/add/update/delete methods.
 */

import {
  Supplier,
  Account,
  JournalEntry,
  Purchase,
  Expense,
  Receipt,
  Payment,
  CreditNote,
  DebitNote,
  PaymentRecord,
} from './types';
import { generateDefaultAccounts } from './accounting';

// Storage keys (user-scoped via suffix)
const KEYS = {
  SUPPLIERS: 'billu_suppliers',
  ACCOUNTS: 'billu_accounts',
  JOURNAL_ENTRIES: 'billu_journal_entries',
  PURCHASES: 'billu_purchases',
  EXPENSES: 'billu_expenses',
  RECEIPTS: 'billu_receipts',
  PAYMENTS: 'billu_payments',
  CREDIT_NOTES: 'billu_credit_notes',
  DEBIT_NOTES: 'billu_debit_notes',
  PAYMENT_HISTORY: 'billu_payment_history',
};

class AccountingStorage {
  private currentUserId: string | null = null;

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  setUserId(userId: string | null): void {
    this.currentUserId = userId;
  }

  private getKey(base: string): string {
    return this.currentUserId ? `${base}_${this.currentUserId}` : base;
  }

  // ========================
  // GENERIC CRUD HELPERS
  // ========================

  private getItems<T>(baseKey: string): T[] {
    if (!this.isBrowser()) return [];
    try {
      const key = this.getKey(baseKey);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveItems<T>(baseKey: string, items: T[]): void {
    if (!this.isBrowser()) return;
    const key = this.getKey(baseKey);
    localStorage.setItem(key, JSON.stringify(items));
  }

  // ========================
  // SUPPLIERS
  // ========================

  getSuppliers(): Supplier[] {
    return this.getItems<Supplier>(KEYS.SUPPLIERS);
  }

  saveSuppliers(suppliers: Supplier[]): void {
    this.saveItems(KEYS.SUPPLIERS, suppliers);
  }

  addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
    const suppliers = this.getSuppliers();
    const newSupplier: Supplier = {
      ...supplier,
      id: `sup-${Date.now()}`,
      userId: this.currentUserId || undefined,
      createdAt: new Date().toISOString(),
    };
    suppliers.unshift(newSupplier);
    this.saveSuppliers(suppliers);
    return newSupplier;
  }

  updateSupplier(supplier: Supplier): void {
    const suppliers = this.getSuppliers().map((s) => (s.id === supplier.id ? supplier : s));
    this.saveSuppliers(suppliers);
  }

  deleteSupplier(id: string): void {
    const suppliers = this.getSuppliers().filter((s) => s.id !== id);
    this.saveSuppliers(suppliers);
  }

  // ========================
  // ACCOUNTS (Chart of Accounts)
  // ========================

  getAccounts(): Account[] {
    const accounts = this.getItems<Account>(KEYS.ACCOUNTS);
    // Seed default accounts if empty and user is set
    if (accounts.length === 0 && this.currentUserId) {
      const defaults = generateDefaultAccounts(this.currentUserId);
      this.saveAccounts(defaults);
      return defaults;
    }
    return accounts;
  }

  saveAccounts(accounts: Account[]): void {
    this.saveItems(KEYS.ACCOUNTS, accounts);
  }

  addAccount(account: Omit<Account, 'id' | 'createdAt'>): Account {
    const accounts = this.getAccounts();
    const newAccount: Account = {
      ...account,
      id: `acct-${Date.now()}`,
      userId: this.currentUserId || undefined,
      createdAt: new Date().toISOString(),
    };
    accounts.push(newAccount);
    this.saveAccounts(accounts);
    return newAccount;
  }

  getAccountByCode(code: string): Account | undefined {
    return this.getAccounts().find((a) => a.code === code);
  }

  // ========================
  // JOURNAL ENTRIES
  // ========================

  getJournalEntries(): JournalEntry[] {
    return this.getItems<JournalEntry>(KEYS.JOURNAL_ENTRIES);
  }

  saveJournalEntries(entries: JournalEntry[]): void {
    this.saveItems(KEYS.JOURNAL_ENTRIES, entries);
  }

  addJournalEntry(entry: JournalEntry): JournalEntry {
    const entries = this.getJournalEntries();
    entries.unshift(entry);
    this.saveJournalEntries(entries);
    return entry;
  }

  getJournalEntriesByReference(referenceType: string, referenceId: string): JournalEntry[] {
    return this.getJournalEntries().filter(
      (e) => e.referenceType === referenceType && e.referenceId === referenceId
    );
  }

  getJournalEntriesForDateRange(startDate: string, endDate: string): JournalEntry[] {
    return this.getJournalEntries().filter((e) => e.date >= startDate && e.date <= endDate);
  }

  getJournalEntriesForFY(financialYear: string): JournalEntry[] {
    return this.getJournalEntries().filter((e) => e.financialYear === financialYear);
  }

  // ========================
  // PURCHASES
  // ========================

  getPurchases(): Purchase[] {
    return this.getItems<Purchase>(KEYS.PURCHASES);
  }

  savePurchases(purchases: Purchase[]): void {
    this.saveItems(KEYS.PURCHASES, purchases);
  }

  addPurchase(purchase: Omit<Purchase, 'id' | 'createdAt'>): Purchase {
    const purchases = this.getPurchases();
    const newPurchase: Purchase = {
      ...purchase,
      id: `pur-${Date.now()}`,
      userId: this.currentUserId || undefined,
      createdAt: new Date().toISOString(),
    };
    purchases.unshift(newPurchase);
    this.savePurchases(purchases);
    return newPurchase;
  }

  updatePurchase(purchase: Purchase): void {
    const purchases = this.getPurchases().map((p) => (p.id === purchase.id ? purchase : p));
    this.savePurchases(purchases);
  }

  deletePurchase(id: string): void {
    const purchases = this.getPurchases().filter((p) => p.id !== id);
    this.savePurchases(purchases);
  }

  getNextPurchaseNumber(): string {
    const purchases = this.getPurchases();
    const year = new Date().getFullYear();
    const count = purchases.length + 1;
    return `PUR-${year}-${count.toString().padStart(4, '0')}`;
  }

  // ========================
  // EXPENSES
  // ========================

  getExpenses(): Expense[] {
    return this.getItems<Expense>(KEYS.EXPENSES);
  }

  saveExpenses(expenses: Expense[]): void {
    this.saveItems(KEYS.EXPENSES, expenses);
  }

  addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Expense {
    const expenses = this.getExpenses();
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      userId: this.currentUserId || undefined,
      createdAt: new Date().toISOString(),
    };
    expenses.unshift(newExpense);
    this.saveExpenses(expenses);
    return newExpense;
  }

  updateExpense(expense: Expense): void {
    const expenses = this.getExpenses().map((e) => (e.id === expense.id ? expense : e));
    this.saveExpenses(expenses);
  }

  deleteExpense(id: string): void {
    const expenses = this.getExpenses().filter((e) => e.id !== id);
    this.saveExpenses(expenses);
  }

  // ========================
  // RECEIPTS (Money In)
  // ========================

  getReceipts(): Receipt[] {
    return this.getItems<Receipt>(KEYS.RECEIPTS);
  }

  saveReceipts(receipts: Receipt[]): void {
    this.saveItems(KEYS.RECEIPTS, receipts);
  }

  addReceipt(receipt: Omit<Receipt, 'id' | 'createdAt'>): Receipt {
    const receipts = this.getReceipts();
    const newReceipt: Receipt = {
      ...receipt,
      id: `rct-${Date.now()}`,
      userId: this.currentUserId || undefined,
      createdAt: new Date().toISOString(),
    };
    receipts.unshift(newReceipt);
    this.saveReceipts(receipts);
    return newReceipt;
  }

  deleteReceipt(id: string): void {
    const receipts = this.getReceipts().filter((r) => r.id !== id);
    this.saveReceipts(receipts);
  }

  getNextReceiptNumber(): string {
    const receipts = this.getReceipts();
    const year = new Date().getFullYear();
    const count = receipts.length + 1;
    return `RCT-${year}-${count.toString().padStart(4, '0')}`;
  }

  // ========================
  // PAYMENTS (Money Out)
  // ========================

  getPayments(): Payment[] {
    return this.getItems<Payment>(KEYS.PAYMENTS);
  }

  savePayments(payments: Payment[]): void {
    this.saveItems(KEYS.PAYMENTS, payments);
  }

  addPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Payment {
    const payments = this.getPayments();
    const newPayment: Payment = {
      ...payment,
      id: `pmt-${Date.now()}`,
      userId: this.currentUserId || undefined,
      createdAt: new Date().toISOString(),
    };
    payments.unshift(newPayment);
    this.savePayments(payments);
    return newPayment;
  }

  deletePayment(id: string): void {
    const payments = this.getPayments().filter((p) => p.id !== id);
    this.savePayments(payments);
  }

  getNextPaymentNumber(): string {
    const payments = this.getPayments();
    const year = new Date().getFullYear();
    const count = payments.length + 1;
    return `PMT-${year}-${count.toString().padStart(4, '0')}`;
  }

  // ========================
  // CREDIT NOTES
  // ========================

  getCreditNotes(): CreditNote[] {
    return this.getItems<CreditNote>(KEYS.CREDIT_NOTES);
  }

  saveCreditNotes(notes: CreditNote[]): void {
    this.saveItems(KEYS.CREDIT_NOTES, notes);
  }

  addCreditNote(note: Omit<CreditNote, 'id' | 'createdAt'>): CreditNote {
    const notes = this.getCreditNotes();
    const newNote: CreditNote = {
      ...note,
      id: `cn-${Date.now()}`,
      userId: this.currentUserId || undefined,
      createdAt: new Date().toISOString(),
    };
    notes.unshift(newNote);
    this.saveCreditNotes(notes);
    return newNote;
  }

  getNextCreditNoteNumber(): string {
    const notes = this.getCreditNotes();
    const year = new Date().getFullYear();
    const count = notes.length + 1;
    return `CN-${year}-${count.toString().padStart(4, '0')}`;
  }

  // ========================
  // DEBIT NOTES
  // ========================

  getDebitNotes(): DebitNote[] {
    return this.getItems<DebitNote>(KEYS.DEBIT_NOTES);
  }

  saveDebitNotes(notes: DebitNote[]): void {
    this.saveItems(KEYS.DEBIT_NOTES, notes);
  }

  addDebitNote(note: Omit<DebitNote, 'id' | 'createdAt'>): DebitNote {
    const notes = this.getDebitNotes();
    const newNote: DebitNote = {
      ...note,
      id: `dn-${Date.now()}`,
      userId: this.currentUserId || undefined,
      createdAt: new Date().toISOString(),
    };
    notes.unshift(newNote);
    this.saveDebitNotes(notes);
    return newNote;
  }

  getNextDebitNoteNumber(): string {
    const notes = this.getDebitNotes();
    const year = new Date().getFullYear();
    const count = notes.length + 1;
    return `DN-${year}-${count.toString().padStart(4, '0')}`;
  }

  // ========================
  // PAYMENT HISTORY (Partial Payments)
  // ========================

  getPaymentHistory(): PaymentRecord[] {
    return this.getItems<PaymentRecord>(KEYS.PAYMENT_HISTORY);
  }

  savePaymentHistory(records: PaymentRecord[]): void {
    this.saveItems(KEYS.PAYMENT_HISTORY, records);
  }

  addPaymentRecord(record: Omit<PaymentRecord, 'id' | 'createdAt'>): PaymentRecord {
    const records = this.getPaymentHistory();
    const newRecord: PaymentRecord = {
      ...record,
      id: `ph-${Date.now()}`,
      userId: this.currentUserId || undefined,
      createdAt: new Date().toISOString(),
    };
    records.unshift(newRecord);
    this.savePaymentHistory(records);
    return newRecord;
  }

  getPaymentHistoryFor(referenceType: 'INVOICE' | 'PURCHASE', referenceId: string): PaymentRecord[] {
    return this.getPaymentHistory().filter(
      (r) => r.referenceType === referenceType && r.referenceId === referenceId
    );
  }

  getTotalPaidFor(referenceType: 'INVOICE' | 'PURCHASE', referenceId: string): number {
    return this.getPaymentHistoryFor(referenceType, referenceId).reduce(
      (sum, r) => sum + r.amount,
      0
    );
  }
}

export const accountingStorage = new AccountingStorage();
