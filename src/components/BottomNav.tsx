'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Plus,
  BarChart3,
  Menu,
  Truck,
  Receipt,
  ArrowDownLeft,
  X,
} from 'lucide-react';
import { triggerHaptic } from '@/lib/utils';

export type NavTab =
  | 'dashboard'
  | 'invoices'
  | 'create'
  | 'purchases'
  | 'create-purchase'
  | 'expenses'
  | 'receipts-payments'
  | 'products'
  | 'clients'
  | 'suppliers'
  | 'reports'
  | 'settings'
  | 'more';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const [showActionSheet, setShowActionSheet] = useState(false);

  const handleSelect = (tab: NavTab) => {
    triggerHaptic('light');
    onTabChange(tab);
  };

  const handleActionSelect = (tab: NavTab) => {
    setShowActionSheet(false);
    triggerHaptic('medium');
    onTabChange(tab);
  };

  const isMoreActive =
    activeTab === 'more' ||
    activeTab === 'purchases' ||
    activeTab === 'expenses' ||
    activeTab === 'receipts-payments' ||
    activeTab === 'products' ||
    activeTab === 'clients' ||
    activeTab === 'suppliers' ||
    activeTab === 'settings';

  return (
    <>
      <nav className="bottom-nav" aria-label="Bottom Navigation">
        {/* 1. Home */}
        <button
          type="button"
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleSelect('dashboard')}
        >
          <div className="nav-icon-wrapper">
            <LayoutDashboard size={19} />
          </div>
          <span>Home</span>
        </button>

        {/* 2. Sales (Bills) */}
        <button
          type="button"
          className={`nav-item ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => handleSelect('invoices')}
        >
          <div className="nav-icon-wrapper">
            <ReceiptText size={19} />
          </div>
          <span>Sales</span>
        </button>

        {/* 3. CENTER PLUS FAB (Action Sheet Trigger) */}
        <div className="nav-fab-wrapper">
          <button
            type="button"
            className="nav-fab"
            onClick={() => {
              triggerHaptic('medium');
              setShowActionSheet(true);
            }}
            title="Create New Transaction"
            aria-label="Create New Transaction"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
          <span className="nav-fab-label">New</span>
        </div>

        {/* 4. Reports */}
        <button
          type="button"
          className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => handleSelect('reports')}
        >
          <div className="nav-icon-wrapper">
            <BarChart3 size={19} />
          </div>
          <span>Reports</span>
        </button>

        {/* 5. More */}
        <button
          type="button"
          className={`nav-item ${isMoreActive ? 'active' : ''}`}
          onClick={() => handleSelect('more')}
        >
          <div className="nav-icon-wrapper">
            <Menu size={19} />
          </div>
          <span>More</span>
        </button>
      </nav>

      {/* + NEW ACTION SHEET MODAL */}
      {showActionSheet && (
        <div className="modal-overlay" onClick={() => setShowActionSheet(false)} style={{ zIndex: 100 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '380px',
              padding: '16px',
              borderRadius: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 className="title-md" style={{ margin: 0 }}>Create New Transaction</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowActionSheet(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Option 1: Sales Invoice */}
              <button
                type="button"
                className="card"
                onClick={() => handleActionSelect('create')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  marginBottom: 0,
                  cursor: 'pointer',
                  border: '1.5px solid var(--border-subtle)',
                  background: 'var(--surface)',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: 'rgba(37, 99, 235, 0.1)',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ReceiptText size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                    New Sales Invoice
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    GST bill to customer with WhatsApp sharing
                  </div>
                </div>
              </button>

              {/* Option 2: Purchase Bill */}
              <button
                type="button"
                className="card"
                onClick={() => handleActionSelect('create-purchase')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  marginBottom: 0,
                  cursor: 'pointer',
                  border: '1.5px solid var(--border-subtle)',
                  background: 'var(--surface)',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: 'rgba(8, 145, 178, 0.1)',
                    color: '#0891b2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Truck size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                    Record Purchase Bill
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Inward bill from vendor & update stock
                  </div>
                </div>
              </button>

              {/* Option 3: Business Expense */}
              <button
                type="button"
                className="card"
                onClick={() => handleActionSelect('expenses')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  marginBottom: 0,
                  cursor: 'pointer',
                  border: '1.5px solid var(--border-subtle)',
                  background: 'var(--surface)',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: 'rgba(220, 38, 38, 0.1)',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Receipt size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                    Add Business Expense
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Rent, electricity, tea/snacks, travel & ITC
                  </div>
                </div>
              </button>

              {/* Option 4: Money In / Out */}
              <button
                type="button"
                className="card"
                onClick={() => handleActionSelect('receipts-payments')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  marginBottom: 0,
                  cursor: 'pointer',
                  border: '1.5px solid var(--border-subtle)',
                  background: 'var(--surface)',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: 'rgba(22, 163, 74, 0.1)',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ArrowDownLeft size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                    Record Receipt / Payment
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Collect from customer or pay to supplier
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
