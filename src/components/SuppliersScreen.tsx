'use client';

import React, { useState } from 'react';
import { Supplier } from '@/lib/types';
import { triggerHaptic } from '@/lib/utils';
import { Plus, Search, Edit2, Trash2, X, Phone, MessageCircle, MapPin, Truck } from 'lucide-react';

interface SuppliersScreenProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
}

export function SuppliersScreen({
  suppliers,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
}: SuppliersScreenProps) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingSupplier(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setState('');
    setPincode('');
    setGstin('');
    setPan('');
    setNotes('');
    setModalOpen(true);
    triggerHaptic('light');
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setPhone(s.phone);
    setEmail(s.email || '');
    setAddress(s.address || '');
    setCity(s.city || '');
    setState(s.state || '');
    setPincode(s.pincode || '');
    setGstin(s.gstin || '');
    setPan(s.pan || '');
    setNotes(s.notes || '');
    setModalOpen(true);
    triggerHaptic('light');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (editingSupplier) {
      onUpdateSupplier({
        ...editingSupplier,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        gstin: gstin.trim().toUpperCase(),
        pan: pan.trim().toUpperCase(),
        notes: notes.trim(),
      });
    } else {
      onAddSupplier({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        gstin: gstin.trim().toUpperCase(),
        pan: pan.trim().toUpperCase(),
        notes: notes.trim(),
      });
    }
    triggerHaptic('success');
    setModalOpen(false);
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      (s.gstin && s.gstin.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="title-md">Suppliers & Vendors</h2>
          <p className="text-muted text-xs">{suppliers.length} active suppliers</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={openAddModal}>
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search suppliers by name, phone, GSTIN..."
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
          <Truck size={32} color="var(--text-dim)" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No suppliers found</p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ marginTop: '12px' }}
            onClick={openAddModal}
          >
            <Plus size={14} /> Add First Supplier
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((sup) => (
            <div
              key={sup.id}
              className="card"
              style={{ padding: '14px', marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ flex: 1, paddingRight: '12px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {sup.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Phone size={12} color="var(--text-dim)" />
                  <span>{sup.phone}</span>
                </div>
                {sup.gstin && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                    GSTIN: {sup.gstin}
                  </div>
                )}
                {(sup.city || sup.state) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    <MapPin size={11} />
                    <span>{[sup.city, sup.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <a
                    href={`tel:${sup.phone}`}
                    className="icon-button"
                    style={{ width: '30px', height: '30px', color: 'var(--primary)' }}
                    title="Call"
                    onClick={() => triggerHaptic('light')}
                  >
                    <Phone size={13} />
                  </a>
                  <a
                    href={`https://wa.me/91${sup.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-button"
                    style={{ width: '30px', height: '30px', color: '#10b981' }}
                    title="WhatsApp"
                    onClick={() => triggerHaptic('light')}
                  >
                    <MessageCircle size={13} />
                  </a>
                  <button
                    type="button"
                    className="icon-button"
                    style={{ width: '30px', height: '30px' }}
                    onClick={() => openEditModal(sup)}
                    title="Edit"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    style={{ width: '30px', height: '30px', color: '#ef4444' }}
                    onClick={() => {
                      if (confirm(`Delete supplier ${sup.name}?`)) {
                        triggerHaptic('warning');
                        onDeleteSupplier(sup.id);
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
              <h3 className="title-md">{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <button type="button" className="icon-button" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Supplier / Business Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Shyam Materials & Hardware"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    className="form-input"
                    placeholder="10-digit mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="vendor@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Supplier GSTIN (Optional)</label>
                <input
                  type="text"
                  maxLength={15}
                  className="form-input"
                  placeholder="15-character GSTIN"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                />
              </div>

              <div className="form-group">
                <label className="form-label">PAN Number (Optional)</label>
                <input
                  type="text"
                  maxLength={10}
                  className="form-input"
                  placeholder="10-character PAN"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Shop / Building, Road"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="City / Town"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  className="form-input"
                  placeholder="6-digit PIN"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
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
                  {editingSupplier ? 'Save Changes' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
