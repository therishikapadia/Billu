'use client';

import React from 'react';
import { Invoice, CompanySettings, Purchase, Expense } from '@/lib/types';
import { formatCurrency, formatDate, triggerHaptic } from '@/lib/utils';
import { Plus, Clock, CheckCircle2, FileText, ChevronRight, Share2, Building2, ArrowRight, Truck, Receipt, BarChart3 } from 'lucide-react';
import { NavTab } from './BottomNav';

interface DashboardScreenProps {
  invoices: Invoice[];
  settings: CompanySettings;
  purchases?: Purchase[];
  expenses?: Expense[];
  onNavigate: (tab: NavTab) => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onShareInvoice: (invoice: Invoice) => void;
}

export function DashboardScreen({
  invoices,
  settings,
  purchases = [],
  expenses = [],
  onNavigate,
  onSelectInvoice,
  onShareInvoice,
}: DashboardScreenProps) {
  // Check if user has filled in basic details
  const hasAddress = Boolean(settings.address && settings.address.trim().length > 0);
  const hasGstin = Boolean(settings.gstin && settings.gstin.trim().length > 0);
  const hasPhone = Boolean(settings.phone && settings.phone.trim().length > 0);
  const isProfileIncomplete = !hasAddress || !hasGstin || !hasPhone;

  // Financial summaries
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');

  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  const totalPurchases = purchases.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount + (e.gstAmount || 0), 0);
  const netEstimatedProfit = totalInvoiced - totalPurchases - totalExpenses;

  const recentInvoices = invoices.slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* New User: Complete Basic Details Notice */}
      {isProfileIncomplete && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
            border: '1.5px solid #bfdbfe',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Building2 size={20} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                  Please Fill Basic Business Details
                </h3>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  Setup Required
                </span>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px', lineHeight: 1.45 }}>
                Your business details (such as address, GST number, and contact info) appear on all your printed bills and PDFs. Complete them now to start issuing professional invoices:
              </p>

              {/* Missing Details Checklist */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                {!hasAddress && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#9a3412',
                      backgroundColor: '#ffedd5',
                      border: '1px solid #fed7aa',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>⚠️</span> Address & City
                  </span>
                )}
                {!hasGstin && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#9a3412',
                      backgroundColor: '#ffedd5',
                      border: '1px solid #fed7aa',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>⚠️</span> GSTIN Number
                  </span>
                )}
                {!hasPhone && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#9a3412',
                      backgroundColor: '#ffedd5',
                      border: '1px solid #fed7aa',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>⚠️</span> Contact Phone
                  </span>
                )}
              </div>

              <div style={{ marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onClick={() => {
                    triggerHaptic('light');
                    onNavigate('settings');
                  }}
                >
                  <span>Fill Basic Details Now</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <span className="text-muted text-xs">Total Purchases</span>
            <div className="stat-value" style={{ color: '#0891b2' }}>
              {formatCurrency(totalPurchases)}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              {purchases.length} inward bills
            </span>
          </div>

          <div className="stat-box" style={{ background: netEstimatedProfit >= 0 ? '#f0fdf4' : '#fef2f2' }}>
            <span className="text-muted text-xs">Estimated Net Profit</span>
            <div className="stat-value" style={{ color: netEstimatedProfit >= 0 ? '#10b981' : '#ef4444' }}>
              {netEstimatedProfit >= 0 ? `+${formatCurrency(netEstimatedProfit)}` : formatCurrency(netEstimatedProfit)}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Sales - Purchases - Expenses
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

      {/* Quick Accounting Module Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        <button
          type="button"
          className="card"
          onClick={() => {
            triggerHaptic('light');
            onNavigate('purchases');
          }}
          style={{ padding: '10px 6px', textAlign: 'center', marginBottom: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
        >
          <Truck size={18} color="#0891b2" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Purchases</span>
        </button>

        <button
          type="button"
          className="card"
          onClick={() => {
            triggerHaptic('light');
            onNavigate('expenses');
          }}
          style={{ padding: '10px 6px', textAlign: 'center', marginBottom: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
        >
          <Receipt size={18} color="#dc2626" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Expenses</span>
        </button>

        <button
          type="button"
          className="card"
          onClick={() => {
            triggerHaptic('light');
            onNavigate('receipts-payments');
          }}
          style={{ padding: '10px 6px', textAlign: 'center', marginBottom: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
        >
          <CheckCircle2 size={18} color="#16a34a" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Money In/Out</span>
        </button>

        <button
          type="button"
          className="card"
          onClick={() => {
            triggerHaptic('light');
            onNavigate('reports');
          }}
          style={{ padding: '10px 6px', textAlign: 'center', marginBottom: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
        >
          <BarChart3 size={18} color="#4f46e5" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>P&L Reports</span>
        </button>
      </div>

      {/* Directory Quick Links */}
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
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Products & Stock</div>
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
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Clients & Parties</div>
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
