'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/types';
import { formatCurrency, triggerHaptic } from '@/lib/utils';
import { Plus, Search, Edit2, Trash2, X, Package } from 'lucide-react';

interface ProductsScreenProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export function ProductsScreen({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}: ProductsScreenProps) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hsn, setHsn] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState<Product['unit']>('pcs');
  const [taxRate, setTaxRate] = useState('18');
  const [stock, setStock] = useState('');

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setHsn('');
    setPrice('');
    setUnit('pcs');
    setTaxRate('18');
    setStock('');
    setModalOpen(true);
    triggerHaptic('light');
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || '');
    setHsn(p.hsn || '');
    setPrice(p.price.toString());
    setUnit(p.unit);
    setTaxRate(p.taxRate.toString());
    setStock(p.stock ? p.stock.toString() : '');
    setModalOpen(true);
    triggerHaptic('light');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name: name.trim(),
        description: description.trim(),
        hsn: hsn.trim(),
        price: parseFloat(price) || 0,
        unit,
        taxRate: parseFloat(taxRate) || 0,
        stock: stock ? parseInt(stock) : undefined,
      });
    } else {
      onAddProduct({
        name: name.trim(),
        description: description.trim(),
        hsn: hsn.trim(),
        price: parseFloat(price) || 0,
        unit,
        taxRate: parseFloat(taxRate) || 0,
        stock: stock ? parseInt(stock) : undefined,
      });
    }
    triggerHaptic('success');
    setModalOpen(false);
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.hsn && p.hsn.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="title-md">Product Catalog</h2>
          <p className="text-muted text-xs">{products.length} items & services</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={openAddModal}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search products or HSN code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '38px' }}
        />
        <Search
          size={16}
          color="var(--text-dim)"
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <Package size={32} color="var(--text-dim)" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No products found</p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ marginTop: '12px' }}
            onClick={openAddModal}
          >
            <Plus size={14} /> Add First Product
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((prod) => (
            <div
              key={prod.id}
              className="card"
              style={{ padding: '14px', marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ flex: 1, paddingRight: '12px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {prod.name}
                </div>
                {prod.description && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {prod.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  <span>HSN: {prod.hsn || 'None'}</span>
                  &bull;
                  <span>GST: {prod.taxRate}%</span>
                  &bull;
                  <span>Unit: {prod.unit}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(prod.price)}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="icon-button"
                    style={{ width: '30px', height: '30px' }}
                    onClick={() => openEditModal(prod)}
                    title="Edit"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    style={{ width: '30px', height: '30px', color: '#ef4444' }}
                    onClick={() => {
                      if (confirm(`Delete product ${prod.name}?`)) {
                        triggerHaptic('warning');
                        onDeleteProduct(prod.id);
                      }
                    }}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="title-md">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button type="button" className="icon-button" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Product / Service Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Web Development or Laptop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Short item description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Price (₹ Rate) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <select
                    className="form-select"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as Product['unit'])}
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="service">Service</option>
                    <option value="hrs">Hours (hrs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="box">Box</option>
                    <option value="pkt">Packet (pkt)</option>
                    <option value="set">Set</option>
                    <option value="m">Meter (m)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">GST Tax Rate (%)</label>
                  <select
                    className="form-select"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                  >
                    <option value="0">0% (Nil)</option>
                    <option value="5">5% (GST)</option>
                    <option value="12">12% (GST)</option>
                    <option value="18">18% (Standard GST)</option>
                    <option value="28">28% (Luxury GST)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">HSN / SAC Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 998314"
                    value={hsn}
                    onChange={(e) => setHsn(e.target.value)}
                  />
                </div>
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
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
