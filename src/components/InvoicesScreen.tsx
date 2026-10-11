'use client';

import React, { useState, useMemo } from 'react';
import { Invoice } from '@/lib/types';
import {
  formatCurrency,
  formatDate,
  triggerHaptic,
  getFinancialYear,
  getFiscalQuarter,
  getFiscalQuarterLabel,
} from '@/lib/utils';
import {
  Search,
  Plus,
  Share2,
  Eye,
  CheckCircle2,
  Clock,
  Trash2,
  Filter,
  X,
  Calendar,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';

interface InvoicesScreenProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onShareInvoice: (invoice: Invoice) => void;
  onToggleStatus: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onCreateNew: () => void;
}

export function InvoicesScreen({
  invoices,
  onSelectInvoice,
  onShareInvoice,
  onToggleStatus,
  onDeleteInvoice,
  onCreateNew,
}: InvoicesScreenProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'draft'>('all');
  const [selectedFY, setSelectedFY] = useState<string>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
  const [quickPreset, setQuickPreset] = useState<'all' | 'this_month' | 'last_month' | 'this_quarter' | 'this_fy'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Compute distinct Financial Years dynamically from existing data
  const availableFYs = useMemo(() => {
    const set = new Set<string>();
    const currentFY = getFinancialYear(new Date().toISOString());
    if (currentFY) set.add(currentFY);
    invoices.forEach((inv) => {
      const fy = getFinancialYear(inv.date);
      if (fy) set.add(fy);
    });
    return Array.from(set).sort().reverse();
  }, [invoices]);

  // Current date markers for quick preset filtering
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentFY = getFinancialYear(now.toISOString());
  const currentQuarter = getFiscalQuarter(now.toISOString());

  // Filter application
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Search filter
      const matchesSearch =
        !search ||
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        (inv.client?.name && inv.client.name.toLowerCase().includes(search.toLowerCase())) ||
        (inv.client?.phone && inv.client.phone.includes(search));

      // 2. Status filter
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

      // 3. Financial Year filter
      const invFY = getFinancialYear(inv.date);
      const matchesFY = selectedFY === 'all' || invFY === selectedFY;

      // 4. Quarter filter
      const invQuarter = getFiscalQuarter(inv.date);
      const matchesQuarter = selectedQuarter === 'all' || invQuarter.toString() === selectedQuarter;

      // 5. Quick Preset filter
      let matchesPreset = true;
      if (quickPreset !== 'all') {
        const invDate = new Date(inv.date);
        if (!isNaN(invDate.getTime())) {
          if (quickPreset === 'this_month') {
            matchesPreset =
              invDate.getFullYear() === currentYear && invDate.getMonth() === currentMonth;
          } else if (quickPreset === 'last_month') {
            const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
            matchesPreset =
              invDate.getFullYear() === lastMonthDate.getFullYear() &&
              invDate.getMonth() === lastMonthDate.getMonth();
          } else if (quickPreset === 'this_quarter') {
            matchesPreset = invFY === currentFY && invQuarter === currentQuarter;
          } else if (quickPreset === 'this_fy') {
            matchesPreset = invFY === currentFY;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesFY && matchesQuarter && matchesPreset;
    });
  }, [
    invoices,
    search,
    statusFilter,
    selectedFY,
    selectedQuarter,
    quickPreset,
    currentYear,
    currentMonth,
    currentFY,
    currentQuarter,
  ]);

  // Financial summary for filtered set
  const filteredTotal = useMemo(
    () => filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
    [filteredInvoices]
  );
  const filteredPaid = useMemo(
    () =>
      filteredInvoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.grandTotal, 0),
    [filteredInvoices]
  );
  const filteredPending = useMemo(
    () =>
      filteredInvoices
        .filter((inv) => inv.status === 'pending')
        .reduce((sum, inv) => sum + inv.grandTotal, 0),
    [filteredInvoices]
  );

  const hasActiveFilters =
    search !== '' ||
    statusFilter !== 'all' ||
    selectedFY !== 'all' ||
    selectedQuarter !== 'all' ||
    quickPreset !== 'all';

  const clearAllFilters = () => {
    triggerHaptic('light');
    setSearch('');
    setStatusFilter('all');
    setSelectedFY('all');
    setSelectedQuarter('all');
    setQuickPreset('all');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header & Quick Create */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="title-md">Bills & Invoices</h2>
          <p className="text-muted text-xs">
            {filteredInvoices.length} of {invoices.length} bills displayed
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            triggerHaptic('light');
            onCreateNew();
          }}
        >
          <Plus size={16} /> New Bill
        </button>
      </div>

      {/* Search Input & Filter Toggle Bar */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by client or bill #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', paddingRight: search ? '32px' : '12px' }}
          />
          <Search
            size={16}
            color="var(--text-dim)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-dim)',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          type="button"
          className={`btn btn-sm ${showFilters || hasActiveFilters ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            triggerHaptic('light');
            setShowFilters(!showFilters);
          }}
          title="Toggle Filters"
          style={{ gap: '6px' }}
        >
          <Filter size={15} />
          <span>Filters</span>
          {hasActiveFilters && (
            <span
              style={{
                backgroundColor: showFilters || hasActiveFilters ? '#ffffff' : 'var(--primary)',
                color: showFilters || hasActiveFilters ? 'var(--primary)' : '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              !
            </span>
          )}
        </button>
      </div>

      {/* Status Filter Tabs (Always accessible) */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {(['all', 'pending', 'paid', 'draft'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`btn btn-sm ${statusFilter === tab ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              textTransform: 'capitalize',
              fontSize: '0.78rem',
              minHeight: '32px',
              padding: '4px 14px',
            }}
            onClick={() => {
              triggerHaptic('light');
              setStatusFilter(tab);
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Expandable Advanced Filters Panel (FY, Quarters, Presets) */}
      {(showFilters || hasActiveFilters) && (
        <div
          className="card"
          style={{
            padding: '14px',
            marginBottom: 0,
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Calendar size={14} color="var(--primary)" /> Accounting & Fiscal Filters
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px',
            }}
          >
            {/* 1. Financial Year (FY) Filter */}
            <div>
              <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '4px' }}>
                Financial Year (FY)
              </label>
              <select
                className="form-select"
                value={selectedFY}
                onChange={(e) => {
                  triggerHaptic('light');
                  setSelectedFY(e.target.value);
                  setQuickPreset('all');
                }}
                style={{ fontSize: '0.82rem', padding: '7px 10px' }}
              >
                <option value="all">All Financial Years</option>
                {availableFYs.map((fy) => (
                  <option key={fy} value={fy}>
                    {fy} {fy === currentFY ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Quarter (Q1-Q4) Filter */}
            <div>
              <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '4px' }}>
                Fiscal Quarter
              </label>
              <select
                className="form-select"
                value={selectedQuarter}
                onChange={(e) => {
                  triggerHaptic('light');
                  setSelectedQuarter(e.target.value);
                  setQuickPreset('all');
                }}
                style={{ fontSize: '0.82rem', padding: '7px 10px' }}
              >
                <option value="all">All Quarters</option>
                <option value="1">{getFiscalQuarterLabel(1)}</option>
                <option value="2">{getFiscalQuarterLabel(2)}</option>
                <option value="3">{getFiscalQuarterLabel(3)}</option>
                <option value="4">{getFiscalQuarterLabel(4)}</option>
              </select>
            </div>

            {/* 3. Quick Period Presets */}
            <div>
              <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '4px' }}>
                Quick Presets
              </label>
              <select
                className="form-select"
                value={quickPreset}
                onChange={(e) => {
                  triggerHaptic('light');
                  const val = e.target.value as typeof quickPreset;
                  setQuickPreset(val);
                  if (val === 'this_fy') {
                    setSelectedFY(currentFY);
                    setSelectedQuarter('all');
                  } else if (val === 'this_quarter') {
                    setSelectedFY(currentFY);
                    setSelectedQuarter(currentQuarter.toString());
                  } else if (val === 'all') {
                    setSelectedFY('all');
                    setSelectedQuarter('all');
                  }
                }}
                style={{ fontSize: '0.82rem', padding: '7px 10px' }}
              >
                <option value="all">All Time</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_quarter">Current Quarter (Q{currentQuarter})</option>
                <option value="this_fy">Current FY ({currentFY})</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Filtered Financial Metrics Summary Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          padding: '10px 12px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Filtered Volume</div>
          <div
            style={{
              fontSize: '0.92rem',
              fontWeight: 700,
              color: 'var(--primary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {formatCurrency(filteredTotal)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Cleared (Paid)</div>
          <div
            style={{
              fontSize: '0.92rem',
              fontWeight: 700,
              color: 'var(--success)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {formatCurrency(filteredPaid)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Outstanding</div>
          <div
            style={{
              fontSize: '0.92rem',
              fontWeight: 700,
              color: 'var(--warning)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {formatCurrency(filteredPending)}
          </div>
        </div>
      </div>

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>No invoices found</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {hasActiveFilters
              ? 'Try clearing or relaxing your date & fiscal filters'
              : 'Create your first invoice to get started'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={clearAllFilters}
              style={{ marginTop: '12px' }}
            >
              <RotateCcw size={13} /> Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredInvoices.map((inv) => {
            const invFY = getFinancialYear(inv.date);
            const invQuarter = getFiscalQuarter(inv.date);

            return (
              <div
                key={inv.id}
                className="card"
                style={{ padding: '14px', marginBottom: 0, cursor: 'pointer' }}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectInvoice(inv);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {inv.client?.name || 'Walk-in Client'}
                      </span>
                      <span
                        className={`badge ${
                          inv.status === 'paid'
                            ? 'badge-paid'
                            : inv.status === 'draft'
                            ? 'badge-draft'
                            : 'badge-pending'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      #{inv.invoiceNumber} &bull; {formatDate(inv.date)}
                    </div>

                    {/* Fiscal Tags */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                        marginTop: '4px',
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {invFY}
                      </span>
                      <span
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        Q{invQuarter}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        color: 'var(--text-main)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {formatCurrency(inv.grandTotal)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      Due: {formatDate(inv.dueDate)}
                    </div>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '4px 8px', minHeight: '28px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('light');
                      onToggleStatus(inv);
                    }}
                  >
                    {inv.status === 'paid' ? (
                      <>
                        <Clock size={12} color="var(--warning)" /> Mark Pending
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={12} color="var(--success)" /> Mark Paid
                      </>
                    )}
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="icon-button"
                      style={{ width: '30px', height: '30px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('light');
                        onSelectInvoice(inv);
                      }}
                      title="View Bill Details"
                    >
                      <Eye size={14} />
                    </button>

                    <button
                      type="button"
                      className="icon-button"
                      style={{ width: '30px', height: '30px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('light');
                        onShareInvoice(inv);
                      }}
                      title="Share Bill"
                    >
                      <Share2 size={14} />
                    </button>

                    <button
                      type="button"
                      className="icon-button"
                      style={{ width: '30px', height: '30px', color: 'var(--danger)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete invoice #${inv.invoiceNumber}?`)) {
                          triggerHaptic('warning');
                          onDeleteInvoice(inv.id);
                        }
                      }}
                      title="Delete Bill"
                    >
                      <Trash2 size={14} />
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
