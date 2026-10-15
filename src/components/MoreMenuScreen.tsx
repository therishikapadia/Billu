'use client';

import React from 'react';
import { NavTab } from './BottomNav';
import { triggerHaptic } from '@/lib/utils';
import {
  Truck,
  Receipt,
  ArrowDownLeft,
  Package,
  Users,
  BarChart3,
  FileSpreadsheet,
  Settings,
  ChevronRight,
  ReceiptText,
} from 'lucide-react';

interface MoreMenuScreenProps {
  onNavigate: (tab: NavTab) => void;
  productsCount: number;
  clientsCount: number;
  suppliersCount: number;
  purchasesCount: number;
  expensesCount: number;
}

export function MoreMenuScreen({
  onNavigate,
  productsCount,
  clientsCount,
  suppliersCount,
  purchasesCount,
  expensesCount,
}: MoreMenuScreenProps) {
  const menuSections = [
    {
      title: 'Accounting & Transactions',
      items: [
        {
          id: 'invoices' as NavTab,
          label: 'Sales Invoices',
          description: 'Client billing, GST invoices & sharing',
          icon: <ReceiptText size={20} color="#2563eb" />,
          count: null,
        },
        {
          id: 'purchases' as NavTab,
          label: 'Purchases & Vendor Bills',
          description: 'Inward bills, supplier payables & stock updates',
          icon: <Truck size={20} color="#0891b2" />,
          count: purchasesCount > 0 ? purchasesCount : null,
        },
        {
          id: 'expenses' as NavTab,
          label: 'Business Expenses',
          description: 'Rent, electricity, tea/snacks, travel & GST ITC',
          icon: <Receipt size={20} color="#dc2626" />,
          count: expensesCount > 0 ? expensesCount : null,
        },
        {
          id: 'receipts-payments' as NavTab,
          label: 'Money In & Out',
          description: 'Customer receipts & vendor payments',
          icon: <ArrowDownLeft size={20} color="#16a34a" />,
          count: null,
        },
      ],
    },
    {
      title: 'Parties & Inventory',
      items: [
        {
          id: 'products' as NavTab,
          label: 'Products & Inventory',
          description: 'Items, rates, purchase price & stock levels',
          icon: <Package size={20} color="#d97706" />,
          count: productsCount,
        },
        {
          id: 'clients' as NavTab,
          label: 'Customers / Clients',
          description: 'Customer directory, contact numbers & GSTINs',
          icon: <Users size={20} color="#7c3aed" />,
          count: clientsCount,
        },
        {
          id: 'suppliers' as NavTab,
          label: 'Suppliers & Vendors',
          description: 'Vendor directory, contact numbers & GSTINs',
          icon: <Truck size={20} color="#0d9488" />,
          count: suppliersCount,
        },
      ],
    },
    {
      title: 'Reports & Settings',
      items: [
        {
          id: 'reports' as NavTab,
          label: 'Financial Reports & P&L',
          description: 'Profit & Loss, GST Summary, Dues & Day Book',
          icon: <BarChart3 size={20} color="#4f46e5" />,
          count: null,
        },
        {
          id: 'settings' as NavTab,
          label: 'Business Settings',
          description: 'Company profile, GSTIN, bank details & signature',
          icon: <Settings size={20} color="#475569" />,
          count: null,
        },
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
      <div>
        <h2 className="title-md">All Modules</h2>
        <p className="text-muted text-xs">Access all accounting tools and directories</p>
      </div>

      {menuSections.map((sec, idx) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', paddingLeft: '4px' }}>
            {sec.title}
          </span>

          <div className="card" style={{ padding: '4px', marginBottom: 0 }}>
            {sec.items.map((item, itemIdx) => (
              <div
                key={item.id}
                onClick={() => {
                  triggerHaptic('light');
                  onNavigate(item.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  borderBottom: itemIdx < sec.items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: 'var(--surface-sunken)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {item.description}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {item.count !== null && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: 'var(--surface-sunken)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        color: 'var(--text-dim)',
                      }}
                    >
                      {item.count}
                    </span>
                  )}
                  <ChevronRight size={16} color="var(--text-dim)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
