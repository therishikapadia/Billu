'use client';

import React, { useState, useMemo } from 'react';
import { Receipt, Payment, Client, Supplier, Invoice, Purchase } from '@/lib/types';
import { formatCurrency, formatDate, triggerHaptic } from '@/lib/utils';
import {
  Plus,
  Search,
  Trash2,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt as ReceiptIcon,
} from 'lucide-react';

interface ReceiptsPaymentsScreenProps {
  receipts: Receipt[];
  payments: Payment[];
  clients: Client[];
  suppliers: Supplier[];
  invoices: Invoice[];
  purchases: Purchase[];
  onAddReceipt: (receipt: Omit<Receipt, 'id' | 'createdAt'>) => void;
  onDeleteReceipt: (id: string) => void;
  onAddPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => void;
  onDeletePayment: (id: string) => void;
}

export function ReceiptsPaymentsScreen({
  receipts,
  payments,
  clients,
  suppliers,
  invoices,
  purchases,
  onAddReceipt,
  onDeleteReceipt,
  onAddPayment,
  onDeletePayment,
}: ReceiptsPaymentsScreenProps) {
  const [activeTab, setActiveTab] = useState<'receipts' | 'payments'>('receipts');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [partyId, setPartyId] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank' | 'UPI' | 'Card'>('UPI');
  const [description, setDescription] = useState('');

  // Pending items for dropdowns
  const pendingInvoices = useMemo(() => {
    return invoices.filter((i) => i.status === 'pending');
  }, [invoices]);

  const pendingPurchases = useMemo(() => {
    return purchases.filter((p) => p.status === 'pending');
  }, [purchases]);

  const openAddModal = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setDescription('');
    setPaymentMode('UPI');

    if (activeTab === 'receipts') {
      const firstClient = clients[0]?.id || '';
      setPartyId(firstClient);
      setReferenceId('');
    } else {
      const firstSupplier = suppliers[0]?.id || '';
      setPartyId(firstSupplier);
      setReferenceId('');
    }

    setModalOpen(true);
    triggerHaptic('light');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    if (activeTab === 'receipts') {
      const client = clients.find((c) => c.id === partyId);
      const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;
      onAddReceipt({
        receiptNumber,
        date,
        amount: parsedAmount,
        referenceType: referenceId ? 'INVOICE' : 'GENERAL',
        referenceId: referenceId || undefined,
        partyId: partyId || undefined,
        partyName: client?.name || 'Customer',
        paymentMode,
        paymentAccount: paymentMode,
        description: description.trim() || undefined,
      });
    } else {
      const supplier = suppliers.find((s) => s.id === partyId);
      const paymentNumber = `PAY-${Date.now().toString().slice(-6)}`;
      onAddPayment({
        paymentNumber,
        date,
        amount: parsedAmount,
        referenceType: referenceId ? 'PURCHASE' : 'GENERAL',
        referenceId: referenceId || undefined,
        partyId: partyId || undefined,
        partyName: supplier?.name || 'Vendor',
        paymentMode,
        paymentAccount: paymentMode,
        description: description.trim() || undefined,
      });
    }

    triggerHaptic('success');
    setModalOpen(false);
  };

  // Metrics
  const totalReceived = useMemo(() => receipts.reduce((sum, r) => sum + r.amount, 0), [receipts]);
  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
  const netCashFlow = totalReceived - totalPaid;

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      return (
        !search ||
        r.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
        (r.partyName && r.partyName.toLowerCase().includes(search.toLowerCase())) ||
        (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [receipts, search]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      return (
        !search ||
        p.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
        (p.partyName && p.partyName.toLowerCase().includes(search.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [payments, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="title-md">Money In & Out</h2>
          <p className="text-muted text-xs">Customer receipts & vendor payments</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={openAddModal}>
          <Plus size={16} /> {activeTab === 'receipts' ? 'Record Receipt' : 'Record Payment'}
        </button>
      </div>

      {/* Segmented Tab Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--surface-sunken)',
          padding: '4px',
          borderRadius: '10px',
          gap: '4px',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('receipts');
            triggerHaptic('light');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeTab === 'receipts' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'receipts' ? '#10b981' : 'var(--text-muted)',
            boxShadow: activeTab === 'receipts' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <ArrowDownLeft size={16} />
          <span>Money In (Receipts)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('payments');
            triggerHaptic('light');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeTab === 'payments' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'payments' ? '#ef4444' : 'var(--text-muted)',
            boxShadow: activeTab === 'payments' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <ArrowUpRight size={16} />
          <span>Money Out (Payments)</span>
        </button>
      </div>

      {/* Aggregate Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div className="card" style={{ padding: '10px 12px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.68rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 600 }}>
            Total In (Receipts)
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            +{formatCurrency(totalReceived)}
          </div>
        </div>

        <div className="card" style={{ padding: '10px 12px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.68rem', color: '#ef4444', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Out (Paid)
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            -{formatCurrency(totalPaid)}
          </div>
        </div>

        <div className="card" style={{ padding: '10px 12px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Net Inflow
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              color: netCashFlow >= 0 ? '#10b981' : '#ef4444',
              marginTop: '2px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {netCashFlow >= 0 ? `+${formatCurrency(netCashFlow)}` : formatCurrency(netCashFlow)}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          placeholder={activeTab === 'receipts' ? 'Search receipts, customer name...' : 'Search payments, vendor name...'}
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

      {/* List */}
      {activeTab === 'receipts' ? (
        filteredReceipts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <ReceiptIcon size={34} color="var(--text-dim)" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No receipts recorded</p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ marginTop: '12px' }}
              onClick={openAddModal}
            >
              <Plus size={14} /> Record First Receipt
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredReceipts.map((rec) => (
              <div
                key={rec.id}
                className="card"
                style={{
                  padding: '12px 14px',
                  marginBottom: 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderLeft: '4px solid #10b981',
                }}
              >
                <div style={{ flex: 1, paddingRight: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      {rec.receiptNumber}
                    </span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 5px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>
                      {rec.paymentMode}
                    </span>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px' }}>
                    {rec.partyName || 'Customer'}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    <span>{formatDate(rec.date)}</span>
                    {rec.referenceId && (
                      <>
                        &bull;
                        <span>Ref: {rec.referenceId}</span>
                      </>
                    )}
                    {rec.description && (
                      <>
                        &bull;
                        <span>{rec.description}</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    +{formatCurrency(rec.amount)}
                  </div>

                  <button
                    type="button"
                    className="icon-button"
                    style={{ width: '28px', height: '28px', color: '#ef4444' }}
                    onClick={() => {
                      if (confirm(`Delete receipt ${rec.receiptNumber}?`)) {
                        triggerHaptic('warning');
                        onDeleteReceipt(rec.id);
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
        )
      ) : filteredPayments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <ReceiptIcon size={34} color="var(--text-dim)" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No payments recorded</p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ marginTop: '12px' }}
            onClick={openAddModal}
          >
            <Plus size={14} /> Record First Payment
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredPayments.map((pay) => (
            <div
              key={pay.id}
              className="card"
              style={{
                padding: '12px 14px',
                marginBottom: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: '4px solid #ef4444',
              }}
            >
              <div style={{ flex: 1, paddingRight: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                    {pay.paymentNumber}
                  </span>
                  <span style={{ fontSize: '0.65rem', padding: '2px 5px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700 }}>
                    {pay.paymentMode}
                  </span>
                </div>

                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px' }}>
                  {pay.partyName || 'Vendor'}
                </div>

                <div style={{ display: 'flex', gap: '6px', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  <span>{formatDate(pay.date)}</span>
                  {pay.referenceId && (
                    <>
                      &bull;
                      <span>Ref: {pay.referenceId}</span>
                    </>
                  )}
                  {pay.description && (
                    <>
                      &bull;
                      <span>{pay.description}</span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                  -{formatCurrency(pay.amount)}
                </div>

                <button
                  type="button"
                  className="icon-button"
                  style={{ width: '28px', height: '28px', color: '#ef4444' }}
                  onClick={() => {
                    if (confirm(`Delete payment ${pay.paymentNumber}?`)) {
                      triggerHaptic('warning');
                      onDeletePayment(pay.id);
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

      {/* Add Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="title-md">{activeTab === 'receipts' ? 'Record Customer Receipt' : 'Record Vendor Payment'}</h3>
              <button type="button" className="icon-button" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
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

              {activeTab === 'receipts' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Customer / Client *</label>
                    <select
                      className="form-select"
                      value={partyId}
                      onChange={(e) => setPartyId(e.target.value)}
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                      ))}
                      {clients.length === 0 && <option value="">No clients found</option>}
                    </select>
                  </div>

                  {pendingInvoices.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">Link to Pending Bill (Optional)</label>
                      <select
                        className="form-select"
                        value={referenceId}
                        onChange={(e) => {
                          setReferenceId(e.target.value);
                          const inv = invoices.find((i) => i.id === e.target.value);
                          if (inv) {
                            setAmount(inv.grandTotal.toString());
                            if (inv.clientId) setPartyId(inv.clientId);
                          }
                        }}
                      >
                        <option value="">-- Direct / General Receipt --</option>
                        {pendingInvoices.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            Bill {inv.invoiceNumber} — {inv.client?.name} ({formatCurrency(inv.grandTotal)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Supplier / Vendor *</label>
                    <select
                      className="form-select"
                      value={partyId}
                      onChange={(e) => setPartyId(e.target.value)}
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                      ))}
                      {suppliers.length === 0 && <option value="">No suppliers found</option>}
                    </select>
                  </div>

                  {pendingPurchases.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">Link to Purchase Bill (Optional)</label>
                      <select
                        className="form-select"
                        value={referenceId}
                        onChange={(e) => {
                          setReferenceId(e.target.value);
                          const p = purchases.find((p) => p.id === e.target.value);
                          if (p) {
                            setAmount(p.grandTotal.toString());
                            if (p.supplierId) setPartyId(p.supplierId);
                          }
                        }}
                      >
                        <option value="">-- Direct / General Payment --</option>
                        {pendingPurchases.map((p) => (
                          <option key={p.id} value={p.id}>
                            Bill {p.purchaseNumber} — {p.supplierData?.name} ({formatCurrency(p.grandTotal)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

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
                <label className="form-label">Notes / Reference (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. UTR # or Cheque # or note"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
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
                  {activeTab === 'receipts' ? 'Save Receipt' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
