'use client';

import React, { useState, useMemo } from 'react';
import { Invoice, Client, Product, InvoiceItem, CompanySettings } from '@/lib/types';
import { formatCurrency, triggerHaptic } from '@/lib/utils';
import { Plus, Trash2, Eye, EyeOff, Check, UserPlus, Sparkles } from 'lucide-react';
import { SignaturePad } from './SignaturePad';
import { InvoiceTemplate } from './InvoiceTemplate';
import confetti from 'canvas-confetti';

interface CreateBillScreenProps {
  clients: Client[];
  products: Product[];
  settings: CompanySettings;
  onSaveInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  onQuickAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<Client> | Client;
  nextInvoiceNumber: string;
}

export function CreateBillScreen({
  clients,
  products,
  settings,
  onSaveInvoice,
  onQuickAddClient,
  nextInvoiceNumber,
}: CreateBillScreenProps) {
  // 1. Basic Info
  const [invoiceNumber, setInvoiceNumber] = useState(nextInvoiceNumber);
  const todayStr = new Date().toISOString().split('T')[0];
  const dueStr = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(dueStr);

  // 2. Client Selection
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientGstin, setNewClientGstin] = useState('');

  // 3. Line Items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: `item-${Date.now()}`,
      productId: products[0]?.id,
      name: products[0]?.name || 'Consulting Service',
      description: products[0]?.description || '',
      hsn: products[0]?.hsn || '998314',
      quantity: 1,
      unit: products[0]?.unit || 'service',
      price: products[0]?.price || 5000,
      discountPercent: 0,
      taxRate: products[0]?.taxRate || 18,
      amount: products[0]?.price || 5000,
      taxAmount: (products[0]?.price || 5000) * ((products[0]?.taxRate || 18) / 100),
    },
  ]);

  // 4. Financial Options
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxType, setTaxType] = useState<'GST_INTRA_STATE' | 'GST_INTER_STATE'>('GST_INTRA_STATE');
  const [notes, setNotes] = useState(settings.notes || 'Thank you for your business!');
  const [terms, setTerms] = useState(settings.terms);

  // 5. Signature
  const [signatureData, setSignatureData] = useState<string>(settings.signatureUrl || '');
  const [signatoryName, setSignatoryName] = useState<string>('Authorized Signatory');

  // Preview toggle for mobile
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Current client object
  const currentClient = useMemo(() => {
    return (
      clients.find((c) => c.id === selectedClientId) ||
      clients[0] || {
        id: 'walkin',
        name: 'Walk-in Customer',
        phone: '+91 99999 99999',
        billingAddress: 'Direct Cash Sale',
        createdAt: new Date().toISOString(),
      }
    );
  }, [clients, selectedClientId]);

  // Recalculate totals
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * (discountValue || 0)) / 100;
    }
    return Math.min(discountValue || 0, subtotal);
  }, [subtotal, discountType, discountValue]);

  const taxAmount = useMemo(() => {
    // Discount ratio across items
    const ratio = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1;
    return items.reduce((sum, item) => {
      const taxableItemAmount = item.amount * ratio;
      return sum + (taxableItemAmount * item.taxRate) / 100;
    }, 0);
  }, [items, subtotal, discountAmount]);

  const rawGrandTotal = subtotal - discountAmount + taxAmount;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

  const cgstAmount = taxType === 'GST_INTRA_STATE' ? Number((taxAmount / 2).toFixed(2)) : 0;
  const sgstAmount = taxType === 'GST_INTRA_STATE' ? Number((taxAmount / 2).toFixed(2)) : 0;
  const igstAmount = taxType === 'GST_INTER_STATE' ? Number(taxAmount.toFixed(2)) : 0;

  // Real-time invoice representation for preview
  const liveInvoice: Invoice = useMemo(() => {
    return {
      id: 'preview',
      invoiceNumber,
      date,
      dueDate,
      clientId: currentClient.id,
      client: currentClient,
      items,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxType,
      taxAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      roundOff,
      grandTotal,
      notes,
      terms,
      signatureData,
      signatoryName,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }, [
    invoiceNumber,
    date,
    dueDate,
    currentClient,
    items,
    subtotal,
    discountType,
    discountValue,
    discountAmount,
    taxType,
    taxAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    roundOff,
    grandTotal,
    notes,
    terms,
    signatureData,
    signatoryName,
  ]);

  // Item helpers
  const handleItemProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index] };
      item.productId = prod.id;
      item.name = prod.name;
      item.description = prod.description || '';
      item.hsn = prod.hsn || '';
      item.price = prod.price;
      item.unit = prod.unit;
      item.taxRate = prod.taxRate;
      item.amount = item.quantity * item.price * (1 - item.discountPercent / 100);
      item.taxAmount = (item.amount * item.taxRate) / 100;
      copy[index] = item;
      return copy;
    });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: unknown) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };
      item.amount = (item.quantity || 1) * (item.price || 0) * (1 - (item.discountPercent || 0) / 100);
      item.taxAmount = (item.amount * (item.taxRate || 0)) / 100;
      copy[index] = item;
      return copy;
    });
  };

  const addItem = () => {
    triggerHaptic('light');
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        name: 'New Item / Service',
        quantity: 1,
        unit: 'pcs',
        price: 1000,
        discountPercent: 0,
        taxRate: 18,
        amount: 1000,
        taxAmount: 180,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    triggerHaptic('warning');
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateQuickClient = async () => {
    if (!newClientName.trim() || !newClientPhone.trim()) return;
    const created = await onQuickAddClient({
      name: newClientName.trim(),
      phone: newClientPhone.trim(),
      billingAddress: newClientAddress.trim(),
      gstin: newClientGstin.trim().toUpperCase(),
    });
    setSelectedClientId(created.id);
    setShowQuickClient(false);
    setNewClientName('');
    setNewClientPhone('');
    setNewClientAddress('');
    setNewClientGstin('');
    triggerHaptic('success');
  };

  const handleFinalSave = () => {
    if (items.length === 0) return;
    triggerHaptic('success');

    // Confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }

    onSaveInvoice({
      invoiceNumber,
      date,
      dueDate,
      clientId: currentClient.id,
      client: currentClient,
      items,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxType,
      taxAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      roundOff,
      grandTotal,
      notes,
      terms,
      signatureData,
      signatureType: 'drawn',
      signatoryName,
      status: 'pending',
    });
  };

  return (
    <div className="create-bill-wrapper">
      {/* LEFT COLUMN: Controls & Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="title-md">Make New Bill</h2>
            <p className="text-muted text-xs">Fill in client, products, tax & signature</p>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-secondary mobile-preview-toggle"
            onClick={() => {
              triggerHaptic('light');
              setShowMobilePreview(!showMobilePreview);
            }}
          >
            {showMobilePreview ? (
              <>
                <EyeOff size={14} /> Edit Bill
              </>
            ) : (
              <>
                <Eye size={14} /> Preview
              </>
            )}
          </button>
        </div>

        {/* Mobile Preview View (if user toggles preview on smaller screens) */}
        {showMobilePreview ? (
          <div className="mobile-only-preview">
            <div style={{ marginBottom: '14px' }}>
              <InvoiceTemplate invoice={liveInvoice} settings={settings} />
            </div>
            <button
              type="button"
              className="btn btn-success btn-full"
              onClick={handleFinalSave}
              style={{ marginTop: '10px' }}
            >
              <Sparkles size={18} /> Confirm & Save Bill ({formatCurrency(grandTotal)})
            </button>
          </div>
        ) : (
          <>
            {/* 1. Client Card */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="title-sm">Client Information</span>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                  onClick={() => setShowQuickClient(true)}
                >
                  <UserPlus size={13} /> + New Client
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Client *</label>
                <select
                  className="form-select"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {currentClient && (
                <div style={{ marginTop: '10px', padding: '8px 10px', background: 'var(--bg-input)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div>{currentClient.billingAddress || 'No address specified'}</div>
                  {currentClient.gstin && <div style={{ color: '#818cf8', fontWeight: 600 }}>GSTIN: {currentClient.gstin}</div>}
                </div>
              )}
            </div>

            {/* Quick Add Client Modal */}
            {showQuickClient && (
              <div className="modal-overlay" onClick={() => setShowQuickClient(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3 className="title-md" style={{ marginBottom: '14px' }}>Quick Add Client</h3>
                  <div className="form-group">
                    <label className="form-label">Client Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Acme Tech"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+91 9876543210"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="City or office address"
                      value={newClientAddress}
                      onChange={(e) => setNewClientAddress(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GSTIN (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Tax ID"
                      value={newClientGstin}
                      onChange={(e) => setNewClientGstin(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button type="button" className="btn btn-secondary btn-full" onClick={() => setShowQuickClient(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-primary btn-full" onClick={handleCreateQuickClient}>
                      Save & Select
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Invoice Metadata */}
            <div className="card">
              <span className="title-sm" style={{ display: 'block', marginBottom: '10px' }}>Bill Details</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Invoice Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Tax Type</label>
                  <select
                    className="form-select"
                    value={taxType}
                    onChange={(e) => setTaxType(e.target.value as 'GST_INTRA_STATE' | 'GST_INTER_STATE')}
                  >
                    <option value="GST_INTRA_STATE">Intra-State (CGST + SGST)</option>
                    <option value="GST_INTER_STATE">Inter-State (IGST)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Invoice Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 3. Line Items */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="title-sm">Products & Services ({items.length})</span>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={addItem}
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px',
                    }}
                  >
                    {/* Item row header with catalog picker */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8' }}>
                        Item #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          className="icon-button"
                          style={{ width: '26px', height: '26px', color: '#ef4444' }}
                          onClick={() => removeItem(idx)}
                          title="Remove item"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    {/* Quick catalog select */}
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <select
                        className="form-select"
                        style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                        value={item.productId || ''}
                        onChange={(e) => handleItemProductSelect(idx, e.target.value)}
                      >
                        <option value="">-- Choose from Catalog or Type Below --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} - ₹{p.price} ({p.taxRate}% GST)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Item name / service"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      />
                    </div>

                    {/* Price, Quantity, Unit, Tax */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>Rate (₹)</label>
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '8px', fontSize: '0.85rem' }}
                          value={item.price}
                          onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>Quantity</label>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          style={{ padding: '8px', fontSize: '0.85rem' }}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>GST %</label>
                        <select
                          className="form-select"
                          style={{ padding: '8px', fontSize: '0.85rem' }}
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>
                      Item Amount: {formatCurrency(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Overall Discount & Notes */}
            <div className="card">
              <span className="title-sm" style={{ display: 'block', marginBottom: '10px' }}>Discounts & Notes</span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select
                    className="form-select"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percent' | 'flat')}
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Discount Value</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Customer Note on Bill</label>
                <input
                  type="text"
                  className="form-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* 5. Signature Section */}
            <div className="card">
              <span className="title-sm" style={{ display: 'block', marginBottom: '8px' }}>
                Bill Authorized Signature
              </span>
              <p className="text-muted text-xs" style={{ marginBottom: '12px' }}>
                Draw with touch screen or upload signature photo for this bill
              </p>

              <SignaturePad
                initialData={signatureData}
                onSave={(dataUrl) => setSignatureData(dataUrl)}
                signatoryName={signatoryName}
                onSignatoryNameChange={setSignatoryName}
              />
            </div>

            {/* Total Summary Sticky Card */}
            <div className="glass-card" style={{ borderColor: 'var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.82rem', color: '#10b981' }}>
                  <span>Discount:</span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>GST Tax ({taxType === 'GST_INTRA_STATE' ? 'CGST+SGST' : 'IGST'}):</span>
                <span>+ {formatCurrency(taxAmount)}</span>
              </div>
              {roundOff !== 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  <span>Round-off:</span>
                  <span>{formatCurrency(roundOff)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', fontSize: '1.25rem', fontWeight: 800 }}>
                <span>Grand Total:</span>
                <span style={{ color: '#6366f1' }}>{formatCurrency(grandTotal)}</span>
              </div>

              <div style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-full"
                  onClick={handleFinalSave}
                >
                  <Check size={18} /> Save & Generate Bill
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* RIGHT COLUMN: Live Bill Preview on Wide Screens (Dynamically responsive) */}
      <div className="bill-preview-side-column">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span className="title-sm" style={{ color: 'var(--text-muted)' }}>Live Bill Preview</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <Sparkles size={13} /> Synchronized
          </span>
        </div>

        <div style={{ transform: 'scale(0.95)', transformOrigin: 'top center', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.06))' }}>
          <InvoiceTemplate invoice={liveInvoice} settings={settings} />
        </div>
      </div>
    </div>
  );
}
