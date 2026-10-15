'use client';

import React, { useState, useMemo } from 'react';
import { Expense } from '@/lib/types';
import { formatCurrency, formatDate, triggerHaptic, getFinancialYear } from '@/lib/utils';
import {
  Plus,
  Search,
  Trash2,
  Receipt,
  X,
  CreditCard,
  Building2,
  Wallet,
  Calendar,
} from 'lucide-react';

export const EXPENSE_CATEGORIES = [
  'Rent & Office',
  'Electricity & Utilities',
  'Salaries & Wages',
  'Tea, Snacks & Refreshment',
  'Transport & Logistics',
  'Repairs & Maintenance',
  'Stationery & Printing',
  'Telephone & Internet',
  'Advertising & Marketing',
  'Bank Fees & Charges',
  'Software & Subscriptions',
  'Miscellaneous Expense',
];

interface ExpensesScreenProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onDeleteExpense: (id: string) => void;
}

export function ExpensesScreen({
  expenses,
  onAddExpense,
  onDeleteExpense,
}: ExpensesScreenProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank' | 'UPI' | 'Card'>('UPI');
  const [vendor, setVendor] = useState('');
  const [gstApplicable, setGstApplicable] = useState(false);
  const [gstRate, setGstRate] = useState('18');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setCategory(EXPENSE_CATEGORIES[0]);
    setDescription('');
    setAmount('');
    setPaymentMode('UPI');
    setVendor('');
    setGstApplicable(false);
    setGstRate('18');
    setNotes('');
    setModalOpen(true);
    triggerHaptic('light');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    let gstAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;

    if (gstApplicable) {
      const rate = parseFloat(gstRate) || 0;
      gstAmount = (parsedAmount * rate) / 100;
      cgstAmount = gstAmount / 2;
      sgstAmount = gstAmount / 2;
    }

    onAddExpense({
      date,
      category,
      description: description.trim(),
      amount: parsedAmount,
      gstApplicable,
      gstRate: gstApplicable ? parseFloat(gstRate) : undefined,
      gstAmount,
      cgstAmount,
      sgstAmount,
      paymentMode,
      paymentAccount: paymentMode,
      vendor: vendor.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    triggerHaptic('success');
    setModalOpen(false);
  };

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        !search ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(search.toLowerCase())) ||
        (e.vendor && e.vendor.toLowerCase().includes(search.toLowerCase()));

      const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [expenses, search, categoryFilter]);

  const totalExpense = useMemo(() => {
    return filtered.reduce((sum, e) => sum + e.amount + (e.gstAmount || 0), 0);
  }, [filtered]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="title-md">Business Expenses</h2>
          <p className="text-muted text-xs">Track operational costs and input GST</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={openAddModal}>
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Summary Card */}
      <div className="card" style={{ padding: '12px 14px', marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Expenses
          </span>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(totalExpense)}
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'right' }}>
          {filtered.length} entries recorded
        </div>
      </div>

      {/* Search & Category Filter */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search expense description, vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', height: '40px' }}
          />
          <Search
            size={16}
            color="var(--text-dim)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '130px', height: '40px', fontSize: '0.78rem' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Expenses List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <Receipt size={34} color="var(--text-dim)" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No expenses recorded</p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ marginTop: '12px' }}
            onClick={openAddModal}
          >
            <Plus size={14} /> Add First Expense
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((exp) => (
            <div
              key={exp.id}
              className="card"
              style={{ padding: '12px 14px', marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ flex: 1, paddingRight: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                    {exp.category}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-dim)',
                    }}
                  >
                    {exp.paymentMode || 'Cash'}
                  </span>
                </div>

                {exp.description && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {exp.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  <span>{formatDate(exp.date)}</span>
                  {exp.vendor && (
                    <>
                      &bull;
                      <span>Paid to: {exp.vendor}</span>
                    </>
                  )}
                  {exp.gstApplicable && (
                    <>
                      &bull;
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>GST ITC: {formatCurrency(exp.gstAmount || 0)}</span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                  -{formatCurrency(exp.amount + (exp.gstAmount || 0))}
                </div>

                <button
                  type="button"
                  className="icon-button"
                  style={{ width: '28px', height: '28px', color: '#ef4444' }}
                  onClick={() => {
                    if (confirm(`Delete this ${exp.category} expense?`)) {
                      triggerHaptic('warning');
                      onDeleteExpense(exp.id);
                    }
                  }}
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Expense Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="title-md">Add Business Expense</h3>
              <button type="button" className="icon-button" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Expense Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="1"
                    className="form-input"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Expense Category *</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Purpose</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. November office rent or client meeting snacks"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-select"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer / NEFT</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Paid To (Vendor)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Landlord or Airtel"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                  />
                </div>
              </div>

              {/* GST ITC Checkbox */}
              <div
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border)',
                  marginTop: '4px',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={gstApplicable}
                    onChange={(e) => setGstApplicable(e.target.checked)}
                  />
                  <span>Includes GST (Claim Input Tax Credit)</span>
                </label>

                {gstApplicable && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GST Rate:</span>
                    <select
                      className="form-select"
                      style={{ width: '90px', padding: '4px 8px', fontSize: '0.8rem' }}
                      value={gstRate}
                      onChange={(e) => setGstRate(e.target.value)}
                    >
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                      +₹{((parseFloat(amount) || 0) * (parseFloat(gstRate) || 0) / 100).toFixed(2)} ITC
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-full">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
