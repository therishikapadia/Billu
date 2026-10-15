'use client';

import React, { useState } from 'react';
import { CompanySettings, User } from '@/lib/types';
import { triggerHaptic } from '@/lib/utils';
import { Building2, CreditCard, FileCheck, Save, Image, Check, LogOut, ShieldCheck } from 'lucide-react';
import { SignaturePad } from './SignaturePad';

interface SettingsScreenProps {
  settings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
  currentUser?: User | null;
  onLogout?: () => void;
}

export function SettingsScreen({ settings, onSaveSettings, currentUser, onLogout }: SettingsScreenProps) {
  const [form, setForm] = useState<CompanySettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'bank' | 'signature' | 'terms'>('company');

  const handleChange = (field: keyof CompanySettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setForm((prev) => ({ ...prev, logoUrl: base64 }));
        triggerHaptic('success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    triggerHaptic('success');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="title-md">Company Settings</h2>
          <p className="text-muted text-xs">Configure your business details on bills</p>
        </div>
        {onLogout && (
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => {
              triggerHaptic('warning');
              onLogout();
            }}
            style={{ fontSize: '0.75rem', gap: '4px', borderColor: '#fca5a5', color: '#dc2626' }}
            title="Sign out of current account"
          >
            <LogOut size={13} /> Sign Out
          </button>
        )}
      </div>

      {/* Account Info Pill */}
      {currentUser && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {currentUser.email}
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.7rem',
              color: '#16a34a',
              backgroundColor: '#f0fdf4',
              padding: '4px 8px',
              borderRadius: '6px',
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={13} />
            <span>Multi-Tenant</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'company' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('company')}
          style={{ fontSize: '0.78rem', minHeight: '32px', padding: '4px 10px' }}
        >
          <Building2 size={13} /> Business
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'bank' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('bank')}
          style={{ fontSize: '0.78rem', minHeight: '32px', padding: '4px 10px' }}
        >
          <CreditCard size={13} /> Bank & UPI
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'signature' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('signature')}
          style={{ fontSize: '0.78rem', minHeight: '32px', padding: '4px 10px' }}
        >
          <FileCheck size={13} /> Signature
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'terms' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('terms')}
          style={{ fontSize: '0.78rem', minHeight: '32px', padding: '4px 10px' }}
        >
          Terms
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* TAB 1: Company Profile */}
        {activeTab === 'company' && (
          <div className="card">
            <h3 className="title-sm" style={{ marginBottom: '12px' }}>Business Profile</h3>

            {/* Logo Upload */}
            <div style={{ marginBottom: '14px' }}>
              <label className="form-label">Company Logo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.logoUrl}
                    alt="Logo"
                    style={{ height: '54px', maxWidth: '120px', objectFit: 'contain', background: '#fff', borderRadius: '6px', padding: '4px' }}
                  />
                ) : (
                  <div style={{ width: '54px', height: '54px', borderRadius: '8px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-subtle)' }}>
                    <Image size={24} color="var(--text-dim)" />
                  </div>
                )}
                <label className="btn btn-sm btn-secondary" style={{ cursor: 'pointer' }}>
                  Upload Logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                </label>
                {form.logoUrl && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => setForm((prev) => ({ ...prev, logoUrl: '' }))}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Company / Legal Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tagline or Subtitle</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Premium Tech Services"
                value={form.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Office Address</label>
              <input
                type="text"
                className="form-input"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">GSTIN (Tax ID)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="27AABCU9603R1ZM"
                  value={form.gstin}
                  onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                />
              </div>

              <div className="form-group">
                <label className="form-label">PAN Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="AABCU9603R"
                  value={form.pan}
                  onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Bank & UPI Payment Details */}
        {activeTab === 'bank' && (
          <div className="card">
            <h3 className="title-sm" style={{ marginBottom: '12px' }}>Bank Transfer & UPI Details</h3>
            <p className="text-muted text-xs" style={{ marginBottom: '14px' }}>
              These details and an interactive UPI QR code will appear on every generated bill.
            </p>

            <div className="form-group">
              <label className="form-label">UPI ID (For Instant Phone QR Scan)</label>
              <input
                type="text"
                className="form-input"
                placeholder="yourcompany@hdfcbank"
                value={form.upiId}
                onChange={(e) => handleChange('upiId', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. HDFC Bank Ltd"
                value={form.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="50200012345678"
                  value={form.accountNumber}
                  onChange={(e) => handleChange('accountNumber', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">IFSC Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="HDFC0000123"
                  value={form.ifsc}
                  onChange={(e) => handleChange('ifsc', e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Digital Signature */}
        {activeTab === 'signature' && (
          <div className="card">
            <h3 className="title-sm" style={{ marginBottom: '8px' }}>Default Authorized Signature</h3>
            <p className="text-muted text-xs" style={{ marginBottom: '14px' }}>
              Sign with your touch screen or upload your official digital signature stamp.
            </p>

            <SignaturePad
              initialData={form.signatureUrl}
              onSave={(dataUrl) => {
                setForm((prev) => ({ ...prev, signatureUrl: dataUrl }));
              }}
            />
          </div>
        )}

        {/* TAB 4: Terms & Notes */}
        {activeTab === 'terms' && (
          <div className="card">
            <h3 className="title-sm" style={{ marginBottom: '12px' }}>Default Terms & Notes</h3>

            <div className="form-group">
              <label className="form-label">Standard Terms & Conditions</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={form.terms}
                onChange={(e) => handleChange('terms', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Customer Thank You Note</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: '16px' }}>
          <button type="submit" className="btn btn-primary btn-full">
            {savedSuccess ? (
              <>
                <Check size={18} color="#fff" /> Saved Successfully!
              </>
            ) : (
              <>
                <Save size={18} /> Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
