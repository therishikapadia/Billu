'use client';

import React, { useState, useMemo } from 'react';
import { Purchase, Supplier, Product, InvoiceItem, CompanySettings } from '@/lib/types';
import { formatCurrency, triggerHaptic } from '@/lib/utils';
import { Plus, Trash2, Check, UserPlus } from 'lucide-react';

interface CreatePurchaseScreenProps {
  suppliers: Supplier[];
  products: Product[];
  settings: CompanySettings;
  onSavePurchase: (purchase: Omit<Purchase, 'id' | 'createdAt'>) => void;
  onQuickAddSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Promise<Supplier> | Supplier;
  nextPurchaseNumber: string;
  onCancel?: () => void;
}

export function CreatePurchaseScreen({
  suppliers,
  products,
  onSavePurchase,
  onQuickAddSupplier,
  nextPurchaseNumber,
  onCancel,
}: CreatePurchaseScreenProps) {
  // 1. Basic Info
  const [purchaseNumber, setPurchaseNumber] = useState(nextPurchaseNumber);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);

  // 2. Supplier Selection
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');
  const [newSupplierGstin, setNewSupplierGstin] = useState('');

  // 3. Line Items
  const [items, setItems] = useState<InvoiceItem[]>(() => [
    {
      id: `item-${Date.now()}`,
      productId: products[0]?.id,
      name: products[0]?.name || 'Raw Materials / Inventory',
      description: products[0]?.description || '',
      hsn: products[0]?.hsn || '',
      quantity: 1,
      unit: products[0]?.unit || 'pcs',
      price: products[0]?.purchasePrice || products[0]?.price || 1000,
      discountPercent: 0,
      taxRate: products[0]?.taxRate || 18,
      amount: products[0]?.purchasePrice || products[0]?.price || 1000,
      taxAmount: (products[0]?.purchasePrice || products[0]?.price || 1000) * ((products[0]?.taxRate || 18) / 100),
    },
  ]);

  // 4. Financial Options
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxType, setTaxType] = useState<'GST_INTRA_STATE' | 'GST_INTER_STATE'>('GST_INTRA_STATE');
  const [notes, setNotes] = useState('Goods received in good condition.');

  // Current supplier object
  const currentSupplier = useMemo(() => {
    return (
      suppliers.find((s) => s.id === selectedSupplierId) ||
      suppliers[0] || {
        id: 'cash-vendor',
        name: 'Direct Cash Vendor',
        phone: '+91 99999 99999',
        address: 'Local Market',
        createdAt: new Date().toISOString(),
      }
    );
  }, [suppliers, selectedSupplierId]);

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
    const factor = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 0;
    return items.reduce((sum, item) => {
      const taxable = item.amount * factor;
      return sum + (taxable * item.taxRate) / 100;
    }, 0);
  }, [items, subtotal, discountAmount]);

  const cgstAmount = useMemo(() => (taxType === 'GST_INTRA_STATE' ? taxAmount / 2 : 0), [taxType, taxAmount]);
  const sgstAmount = useMemo(() => (taxType === 'GST_INTRA_STATE' ? taxAmount / 2 : 0), [taxType, taxAmount]);
  const igstAmount = useMemo(() => (taxType === 'GST_INTER_STATE' ? taxAmount : 0), [taxType, taxAmount]);

  const grandTotalExact = subtotal - discountAmount + taxAmount;
  const grandTotal = Math.round(grandTotalExact);
  const roundOff = Math.round((grandTotal - grandTotalExact) * 100) / 100;

  // Add Item
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      name: '',
      quantity: 1,
      unit: 'pcs',
      price: 0,
      discountPercent: 0,
      taxRate: 18,
      amount: 0,
      taxAmount: 0,
    };
    setItems((prev) => [...prev, newItem]);
    triggerHaptic('light');
  };

  // Select existing product for item
  const handleSelectProduct = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) => {
      const updated = [...prev];
      const itemPrice = prod.purchasePrice || prod.price || 0;
      const qty = updated[index].quantity || 1;
      const amount = qty * itemPrice;
      const taxAmount = (amount * prod.taxRate) / 100;

      updated[index] = {
        ...updated[index],
        productId: prod.id,
        name: prod.name,
        description: prod.description || '',
        hsn: prod.hsn || '',
        price: itemPrice,
        unit: prod.unit,
        taxRate: prod.taxRate,
        amount,
        taxAmount,
      };
      return updated;
    });
    triggerHaptic('light');
  };

  // Update item field
  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      if (field === 'quantity' || field === 'price' || field === 'taxRate') {
        const qty = field === 'quantity' ? Number(value) : item.quantity;
        const prc = field === 'price' ? Number(value) : item.price;
        const rate = field === 'taxRate' ? Number(value) : item.taxRate;
        item.amount = qty * prc;
        item.taxAmount = (item.amount * rate) / 100;
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    triggerHaptic('warning');
  };

  const handleQuickAddSupplier = async () => {
    if (!newSupplierName.trim() || !newSupplierPhone.trim()) return;
    try {
      const created = await onQuickAddSupplier({
        name: newSupplierName.trim(),
        phone: newSupplierPhone.trim(),
        address: newSupplierAddress.trim(),
        gstin: newSupplierGstin.trim().toUpperCase(),
      });
      setSelectedSupplierId(created.id);
      setShowQuickSupplier(false);
      setNewSupplierName('');
      setNewSupplierPhone('');
      setNewSupplierAddress('');
      setNewSupplierGstin('');
      triggerHaptic('success');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || subtotal <= 0) {
      alert('Please add at least one line item with a positive amount.');
      return;
    }

    const purchaseData: Omit<Purchase, 'id' | 'createdAt'> = {
      purchaseNumber,
      date,
      dueDate,
      supplierId: currentSupplier.id,
      supplier: currentSupplier,
      supplierData: currentSupplier,
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
      status: 'pending',
      amountPaid: 0,
    };

    onSavePurchase(purchaseData);
    triggerHaptic('success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="title-md">Record Purchase Bill</h2>
          <p className="text-muted text-xs">Enter inward purchase invoice from vendor</p>
        </div>
        {onCancel && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Basic Details Card */}
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">Purchase Bill # *</label>
              <input
                type="text"
                required
                className="form-input"
                value={purchaseNumber}
                onChange={(e) => setPurchaseNumber(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bill Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '8px' }}>
            <label className="form-label">Payment Due Date</label>
            <input
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {/* Supplier Selection Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" style={{ margin: 0 }}>Supplier / Vendor *</label>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              onClick={() => setShowQuickSupplier(!showQuickSupplier)}
            >
              <UserPlus size={12} /> {showQuickSupplier ? 'Choose Existing' : '+ Quick Add'}
            </button>
          </div>

          {!showQuickSupplier ? (
            <div>
              <select
                className="form-select"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.phone}) {s.gstin ? `- GST: ${s.gstin}` : ''}
                  </option>
                ))}
                {suppliers.length === 0 && <option value="cash">Direct Cash Vendor</option>}
              </select>

              {currentSupplier && (
                <div style={{ marginTop: '8px', padding: '8px', background: 'var(--surface-sunken)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div><strong>{currentSupplier.name}</strong> &bull; {currentSupplier.phone}</div>
                  {currentSupplier.address && <div>{currentSupplier.address}</div>}
                  {currentSupplier.gstin && <div>GSTIN: <span style={{ color: 'var(--primary)' }}>{currentSupplier.gstin}</span></div>}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <input
                type="text"
                placeholder="Supplier Name *"
                className="form-input"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                className="form-input"
                value={newSupplierPhone}
                onChange={(e) => setNewSupplierPhone(e.target.value)}
              />
              <input
                type="text"
                placeholder="Supplier GSTIN (Optional)"
                className="form-input"
                value={newSupplierGstin}
                onChange={(e) => setNewSupplierGstin(e.target.value.toUpperCase())}
              />
              <input
                type="text"
                placeholder="Address"
                className="form-input"
                value={newSupplierAddress}
                onChange={(e) => setNewSupplierAddress(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleQuickAddSupplier}
                style={{ marginTop: '4px' }}
              >
                Save & Select Supplier
              </button>
            </div>
          )}
        </div>

        {/* Line Items Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 className="title-sm">Items & Inventory</h3>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAddItem}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item, index) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px',
                  background: 'var(--surface-sunken)',
                }}
              >
                {/* Product picker if available */}
                {products.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                      value={item.productId || ''}
                      onChange={(e) => handleSelectProduct(index, e.target.value)}
                    >
                      <option value="">-- Choose from product catalog (optional) --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.purchasePrice ? `(Buy: ₹${p.purchasePrice})` : `(₹${p.price})`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    required
                    placeholder="Item / Material Name *"
                    className="form-input"
                    value={item.name}
                    onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="HSN / SAC"
                    className="form-input"
                    value={item.hsn || ''}
                    onChange={(e) => handleUpdateItem(index, 'hsn', e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(index, 'quantity', Math.max(1, parseFloat(e.target.value) || 1))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Purchase Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={item.price}
                      onChange={(e) => handleUpdateItem(index, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GST Rate (%)</label>
                    <select
                      className="form-select"
                      value={item.taxRate}
                      onChange={(e) => handleUpdateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    Amount: {formatCurrency(item.amount)} + GST: {formatCurrency(item.taxAmount)}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="icon-button"
                      style={{ width: '28px', height: '28px', color: '#ef4444' }}
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GST & Discount Options */}
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">GST Place of Supply</label>
              <select
                className="form-select"
                value={taxType}
                onChange={(e) => setTaxType(e.target.value as any)}
              >
                <option value="GST_INTRA_STATE">Within State (CGST + SGST)</option>
                <option value="GST_INTER_STATE">Out of State (IGST)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Discount</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  style={{ flex: 1 }}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                />
                <select
                  className="form-select"
                  style={{ width: '70px' }}
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                >
                  <option value="percent">%</option>
                  <option value="flat">₹</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '8px' }}>
            <label className="form-label">Notes / Remarks</label>
            <input
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Challan # / PO reference"
            />
          </div>
        </div>

        {/* Summary Card */}
        <div className="card" style={{ background: 'var(--surface)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                <span>Discount:</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {taxType === 'GST_INTRA_STATE' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>CGST:</span>
                  <span>{formatCurrency(cgstAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>SGST:</span>
                  <span>{formatCurrency(sgstAmount)}</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>IGST:</span>
                <span>{formatCurrency(igstAmount)}</span>
              </div>
            )}
            {roundOff !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Round Off:</span>
                <span>{roundOff > 0 ? `+${roundOff}` : roundOff}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 800,
                fontSize: '1.1rem',
                borderTop: '1px solid var(--border)',
                paddingTop: '8px',
                marginTop: '4px',
                color: 'var(--text-main)',
              }}
            >
              <span>Total Bill Amount:</span>
              <span style={{ color: 'var(--primary)' }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ marginTop: '16px', height: '46px', fontSize: '1rem' }}
          >
            <Check size={18} /> Save Purchase Bill
          </button>
        </div>
      </form>
    </div>
  );
}
