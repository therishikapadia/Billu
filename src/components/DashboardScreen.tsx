'use client';

import React from 'react';
import { Invoice, CompanySettings } from '@/lib/types';
import { formatCurrency, formatDate, triggerHaptic } from '@/lib/utils';
import { Plus, ArrowUpRight, Clock, CheckCircle2, FileText, ChevronRight, Share2 } from 'lucide-react';
import { NavTab } from './BottomNav';

interface DashboardScreenProps {
  invoices: Invoice[];
  settings: CompanySettings;
  onNavigate: (tab: NavTab) => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onShareInvoice: (invoice: Invoice) => void;
}

export function DashboardScreen({
  invoices,
  settings,
  onNavigate,
  onSelectInvoice,
  onShareInvoice,
}: DashboardScreenProps) {
  // Financial summaries
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');

  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  const recentInvoices = invoices.slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Welcome Card */}
      <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Company Dashboard
            </span>
            <h2 className="title-lg" style={{ marginTop: '2px' }}>{settings.name}</h2>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
              GSTIN: {settings.gstin || 'Not Configured'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={() => {
              triggerHaptic('medium');
              onNavigate('create');
            }}
          >
            <Plus size={18} /> Make New Bill
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <h3 className="title-sm" style={{ marginBottom: '10px', color: 'var(--text-muted)' }}>
          Financial Overview
        </h3>
        <div className="stats-grid">
          <div className="stat-box">
            <span className="text-muted text-xs">Total Invoiced</span>
            <div className="stat-value">{formatCurrency(totalInvoiced)}</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              {invoices.length} bills total
            </span>
          </div>

          <div className="stat-box success">
            <span className="text-muted text-xs">Paid & Collected</span>
            <div className="stat-value" style={{ color: '#34d399' }}>
              {formatCurrency(totalPaid)}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CheckCircle2 size={12} /> {paidInvoices.length} cleared
            </span>
          </div>

          <div className="stat-box warning">
            <span className="text-muted text-xs">Pending Dues</span>
            <div className="stat-value" style={{ color: '#fbbf24' }}>
              {formatCurrency(totalPending)}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={12} /> {pendingInvoices.length} pending
            </span>
          </div>

          <div className="stat-box">
            <span className="text-muted text-xs">Tax Collected (GST)</span>
            <div className="stat-value" style={{ color: '#818cf8' }}>
              {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.taxAmount || 0), 0))}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              CGST / SGST / IGST
            </span>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            triggerHaptic('light');
            onNavigate('products');
          }}
          style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Products</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Manage Items & Rates</div>
          </div>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            triggerHaptic('light');
            onNavigate('clients');
          }}
          style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Clients</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Manage Directory</div>
          </div>
        </button>
      </div>

      {/* Recent Invoices */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 className="title-sm" style={{ color: 'var(--text-muted)' }}>Recent Invoices</h3>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => onNavigate('invoices')}
            style={{ fontSize: '0.75rem' }}
          >
            View All <ChevronRight size={14} />
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
            <FileText size={32} color="var(--text-dim)" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No bills created yet</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Tap below to create your very first bill!
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ marginTop: '12px' }}
              onClick={() => onNavigate('create')}
            >
              <Plus size={14} /> Make Bill
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentInvoices.map((inv) => (
              <div
                key={inv.id}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 0,
                  padding: '12px 14px',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectInvoice(inv);
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {inv.client?.name || 'Walk-in'}
                    </span>
                    <span className={`badge ${inv.status === 'paid' ? 'badge-paid' : inv.status === 'draft' ? 'badge-draft' : 'badge-pending'}`}>
                      {inv.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    #{inv.invoiceNumber} &bull; {formatDate(inv.date)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(inv.grandTotal)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {inv.items.length} items
                    </div>
                  </div>

                  <button
                    type="button"
                    className="icon-button"
                    style={{ width: '32px', height: '32px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('light');
                      onShareInvoice(inv);
                    }}
                    title="Share Invoice"
                  >
                    <Share2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
