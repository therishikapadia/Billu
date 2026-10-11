'use client';

import React, { useState } from 'react';
import { Client } from '@/lib/types';
import { triggerHaptic } from '@/lib/utils';
import { Plus, Search, Edit2, Trash2, X, Phone, MessageCircle, MapPin, Users } from 'lucide-react';

interface ClientsScreenProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

export function ClientsScreen({
  clients,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
}: ClientsScreenProps) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');

  const openAddModal = () => {
    setEditingClient(null);
    setName('');
    setPhone('');
    setEmail('');
    setBillingAddress('');
    setCity('');
    setState('');
    setPincode('');
    setGstin('');
    setModalOpen(true);
    triggerHaptic('light');
  };

  const openEditModal = (c: Client) => {
    setEditingClient(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setBillingAddress(c.billingAddress);
    setCity(c.city || '');
    setState(c.state || '');
    setPincode(c.pincode || '');
    setGstin(c.gstin || '');
    setModalOpen(true);
    triggerHaptic('light');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (editingClient) {
      onUpdateClient({
        ...editingClient,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        billingAddress: billingAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        gstin: gstin.trim().toUpperCase(),
      });
    } else {
      onAddClient({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        billingAddress: billingAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        gstin: gstin.trim().toUpperCase(),
      });
    }
    triggerHaptic('success');
    setModalOpen(false);
  };

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.gstin && c.gstin.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="title-md">Client Directory</h2>
          <p className="text-muted text-xs">{clients.length} registered clients</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={openAddModal}>
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by name, phone or GSTIN..."
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
          <Users size={32} color="var(--text-dim)" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No clients found</p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ marginTop: '12px' }}
            onClick={openAddModal}
          >
            <Plus size={14} /> Add First Client
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((client) => {
            const cleanPhone = client.phone.replace(/[^0-9]/g, '');

            return (
              <div
                key={client.id}
                className="card"
                style={{ padding: '14px', marginBottom: 0 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {client.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>{client.phone}</span>
                      {client.email && <span>&bull; {client.email}</span>}
                    </div>

                    {client.billingAddress && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {client.billingAddress} {client.city ? `, ${client.city}` : ''}
                      </p>
                    )}

                    {client.gstin && (
                      <span className="badge" style={{ marginTop: '6px', background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                        GSTIN: {client.gstin}
                      </span>
                    )}
                  </div>

                  {/* Actions & WhatsApp button */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="icon-button"
                        style={{ width: '30px', height: '30px', color: '#10b981', textDecoration: 'none' }}
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </a>
                    )}
                    {client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="icon-button"
                        style={{ width: '30px', height: '30px', color: '#06b6d4', textDecoration: 'none' }}
                        title="Call Client"
                      >
                        <Phone size={14} />
                      </a>
                    )}
                    <button
                      type="button"
                      className="icon-button"
                      style={{ width: '30px', height: '30px' }}
                      onClick={() => openEditModal(client)}
                      title="Edit Client"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      style={{ width: '30px', height: '30px', color: '#ef4444' }}
                      onClick={() => {
                        if (confirm(`Delete client ${client.name}?`)) {
                          triggerHaptic('warning');
                          onDeleteClient(client.id);
                        }
                      }}
                      title="Delete Client"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="title-md">{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
              <button type="button" className="icon-button" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Client / Business Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Acme Retail or John Smith"
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
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="client@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Billing Address</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '60px' }}
                  placeholder="Street address, building, area"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 400001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">GSTIN (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 27AABCU9603R1ZM"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
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
                  {editingClient ? 'Save Changes' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
