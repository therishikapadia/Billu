'use client';

import React from 'react';
import { LayoutDashboard, ReceiptText, Plus, Package, Users } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils';

export type NavTab = 'dashboard' | 'invoices' | 'create' | 'products' | 'clients' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const handleSelect = (tab: NavTab) => {
    triggerHaptic('light');
    onTabChange(tab);
  };

  return (
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

      {/* 2. Bills */}
      <button
        type="button"
        className={`nav-item ${activeTab === 'invoices' ? 'active' : ''}`}
        onClick={() => handleSelect('invoices')}
      >
        <div className="nav-icon-wrapper">
          <ReceiptText size={19} />
        </div>
        <span>Bills</span>
      </button>

      {/* 3. CENTER PLUS FAB (Exact Center Alignment) */}
      <div className="nav-fab-wrapper">
        <button
          type="button"
          className="nav-fab"
          onClick={() => handleSelect('create')}
          title="Make New Bill"
          aria-label="Make New Bill"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
        <span className="nav-fab-label">New Bill</span>
      </div>

      {/* 4. Products */}
      <button
        type="button"
        className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
        onClick={() => handleSelect('products')}
      >
        <div className="nav-icon-wrapper">
          <Package size={19} />
        </div>
        <span>Products</span>
      </button>

      {/* 5. Clients */}
      <button
        type="button"
        className={`nav-item ${activeTab === 'clients' ? 'active' : ''}`}
        onClick={() => handleSelect('clients')}
      >
        <div className="nav-icon-wrapper">
          <Users size={19} />
        </div>
        <span>Clients</span>
      </button>
    </nav>
  );
}
