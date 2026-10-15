'use client';

import React, { useState, useMemo } from 'react';
import { Purchase } from '@/lib/types';
import { formatCurrency, formatDate, triggerHaptic, getFinancialYear } from '@/lib/utils';
import {
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Filter,
  X,
  Truck,
  RotateCcw,
} from 'lucide-react';

interface PurchasesScreenProps {
  purchases: Purchase[];
  onToggleStatus: (purchase: Purchase) => void;
  onDeletePurchase: (id: string) => void;
  onCreateNew: () => void;
}

export function PurchasesScreen({
  purchases,
  onToggleStatus,
  onDeletePurchase,
  onCreateNew,
}: PurchasesScreenProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [selectedFY, setSelectedFY] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Available Financial Years
  const availableFYs = useMemo(() => {
    const set = new Set<string>();
    const currentFY = getFinancialYear(new Date().toISOString());
    if (currentFY) set.add(currentFY);
    purchases.forEach((p) => {
      const fy = getFinancialYear(p.date);
      if (fy) set.add(fy);
    });
    return Array.from(set).sort().reverse();
  }, [purchases]);

  // Filter application
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchesSearch =
        !search ||
        p.purchaseNumber.toLowerCase().includes(search.toLowerCase()) ||
        (p.supplierData?.name && p.supplierData.name.toLowerCase().includes(search.toLowerCase())) ||
        (p.supplierData?.phone && p.supplierData.phone.includes(search));

      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const pFY = getFinancialYear(p.date);
      const matchesFY = selectedFY === 'all' || pFY === selectedFY;

      return matchesSearch && matchesStatus && matchesFY;
    });
  }, [purchases, search, statusFilter, selectedFY]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = filteredPurchases.reduce((sum, p) => sum + p.grandTotal, 0);
    const paid = filteredPurchases.reduce((sum, p) => (p.status === 'paid' ? sum + p.grandTotal : sum + (p.amountPaid || 0)), 0);
    const pending = Math.max(0, total - paid);
    return { total, paid, pending };
  }, [filteredPurchases]);

  const hasActiveFilters = statusFilter !== 'all' || selectedFY !== 'all' || search !== '';

  const resetFilters = () => {
    setStatusFilter('all');
    setSelectedFY('all');
    setSearch('');
    triggerHaptic('light');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="title-md">Purchases & Inward Bills</h2>
          <p className="text-muted text-xs">Manage bills received from vendors</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={onCreateNew}>
          <Plus size={16} /> New Purchase
        </button>
      </div>

      {/* Aggregate Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div className="card" style={{ padding: '10px 12px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Inward
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(metrics.total)}
          </div>
        </div>

        <div className="card" style={{ padding: '10px 12px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.68rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 600 }}>
            Paid Out
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(metrics.paid)}
          </div>
        </div>

        <div className="card" style={{ padding: '10px 12px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.68rem', color: '#ef4444', textTransform: 'uppercase', fontWeight: 600 }}>
            Payables Due
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ef4444', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(metrics.pending)}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search bill #, vendor name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', height: '40px' }}
          />
          <Search
            size={16}
            color="var(--text-dim)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          {search && (
            <button
              type="button"
              className="icon-button"
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px' }}
              onClick={() => setSearch('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="button"
          className={`btn ${showFilters || hasActiveFilters ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ height: '40px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={15} />
          {hasActiveFilters && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
        </button>
      </div>

      {/* Collapsible Filter Tray */}
      {showFilters && (
        <div className="card" style={{ padding: '12px', marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Filter Purchases</span>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                onClick={resetFilters}
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending (Unpaid)</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Financial Year</label>
              <select
                className="form-select"
                value={selectedFY}
                onChange={(e) => setSelectedFY(e.target.value)}
              >
                <option value="all">All Financial Years</option>
                {availableFYs.map((fy) => (
                  <option key={fy} value={fy}>{fy}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Purchases List */}
      {filteredPurchases.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Truck size={36} color="var(--text-dim)" style={{ margin: '0 auto 10px' }} />
          <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No purchase bills found</p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ marginTop: '12px' }}
            onClick={onCreateNew}
          >
            <Plus size={14} /> Record First Purchase Bill
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredPurchases.map((purchase) => {
            const isPaid = purchase.status === 'paid';
            return (
              <div
                key={purchase.id}
                className="card"
                style={{
                  padding: '14px',
                  marginBottom: 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderLeft: isPaid ? '4px solid #10b981' : '4px solid #ef4444',
                }}
              >
                <div style={{ flex: 1, paddingRight: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      {purchase.purchaseNumber}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isPaid ? '#10b981' : '#ef4444',
                      }}
                    >
                      {isPaid ? 'PAID' : 'PENDING'}
                    </span>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)', marginTop: '4px' }}>
                    {purchase.supplierData?.name || 'Vendor'}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    <span>Date: {formatDate(purchase.date)}</span>
                    {purchase.dueDate && (
                      <>
                        &bull;
                        <span>Due: {formatDate(purchase.dueDate)}</span>
                      </>
                    )}
                    &bull;
                    <span>{purchase.items?.length || 0} items</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(purchase.grandTotal)}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="icon-button"
                      style={{
                        width: '32px',
                        height: '32px',
                        color: isPaid ? '#10b981' : 'var(--text-dim)',
                      }}
                      title={isPaid ? 'Mark as Pending' : 'Mark as Paid'}
                      onClick={() => {
                        triggerHaptic('medium');
                        onToggleStatus(purchase);
                      }}
                    >
                      {isPaid ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                    </button>

                    <button
                      type="button"
                      className="icon-button"
                      style={{ width: '32px', height: '32px', color: '#ef4444' }}
                      title="Delete Purchase"
                      onClick={() => {
                        if (confirm(`Delete purchase bill ${purchase.purchaseNumber}?`)) {
                          triggerHaptic('warning');
                          onDeletePurchase(purchase.id);
                        }
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
