'use client';

import React, { useState, useMemo } from 'react';
import { Invoice, Purchase, Expense, Receipt, Payment, Client, Supplier } from '@/lib/types';
import { formatCurrency, formatDate, triggerHaptic, getFinancialYear } from '@/lib/utils';
import {
  TrendingUp,
  FileText,
  Download,
  Calendar,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  CheckCircle,
  MessageCircle,
} from 'lucide-react';

interface ReportsScreenProps {
  invoices: Invoice[];
  purchases: Purchase[];
  expenses: Expense[];
  receipts: Receipt[];
  payments: Payment[];
  clients: Client[];
  suppliers: Supplier[];
}

export function ReportsScreen({
  invoices,
  purchases,
  expenses,
  receipts,
  payments,
  clients,
  suppliers,
}: ReportsScreenProps) {
  const [reportTab, setReportTab] = useState<'pnl' | 'gst' | 'dues' | 'registers' | 'ca'>('pnl');
  const [selectedFY, setSelectedFY] = useState<string>('all');

  // Compute available Financial Years
  const availableFYs = useMemo(() => {
    const set = new Set<string>();
    const currentFY = getFinancialYear(new Date().toISOString());
    if (currentFY) set.add(currentFY);
    invoices.forEach((i) => {
      const fy = getFinancialYear(i.date);
      if (fy) set.add(fy);
    });
    return Array.from(set).sort().reverse();
  }, [invoices]);

  // Filtered by FY
  const filteredInvoices = useMemo(() => {
    return selectedFY === 'all' ? invoices : invoices.filter((i) => getFinancialYear(i.date) === selectedFY);
  }, [invoices, selectedFY]);

  const filteredPurchases = useMemo(() => {
    return selectedFY === 'all' ? purchases : purchases.filter((p) => getFinancialYear(p.date) === selectedFY);
  }, [purchases, selectedFY]);

  const filteredExpenses = useMemo(() => {
    return selectedFY === 'all' ? expenses : expenses.filter((e) => getFinancialYear(e.date) === selectedFY);
  }, [expenses, selectedFY]);

  // --- 1. P&L CALCULATION ---
  const pnl = useMemo(() => {
    const totalSales = filteredInvoices.reduce((sum, i) => sum + (i.subtotal - (i.discountAmount || 0)), 0);
    const totalPurchases = filteredPurchases.reduce((sum, p) => sum + (p.subtotal - (p.discountAmount || 0)), 0);
    const grossProfit = totalSales - totalPurchases;

    // Expenses grouped by category
    const expenseByCategory: Record<string, number> = {};
    let totalExpenseAmount = 0;
    filteredExpenses.forEach((e) => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
      totalExpenseAmount += e.amount;
    });

    const netProfit = grossProfit - totalExpenseAmount;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    return {
      totalSales,
      totalPurchases,
      grossProfit,
      expenseByCategory,
      totalExpenseAmount,
      netProfit,
      profitMargin,
    };
  }, [filteredInvoices, filteredPurchases, filteredExpenses]);

  // --- 2. GST REPORT CALCULATION ---
  const gst = useMemo(() => {
    // Output Tax (Sales)
    let outputCGST = 0;
    let outputSGST = 0;
    let outputIGST = 0;
    filteredInvoices.forEach((i) => {
      outputCGST += i.cgstAmount || 0;
      outputSGST += i.sgstAmount || 0;
      outputIGST += i.igstAmount || 0;
    });
    const totalOutputGST = outputCGST + outputSGST + outputIGST;

    // Input Tax Credit (Purchases + Eligible Expenses)
    let inputCGST = 0;
    let inputSGST = 0;
    let inputIGST = 0;
    filteredPurchases.forEach((p) => {
      inputCGST += p.cgstAmount || 0;
      inputSGST += p.sgstAmount || 0;
      inputIGST += p.igstAmount || 0;
    });
    filteredExpenses.forEach((e) => {
      if (e.gstApplicable) {
        inputCGST += e.cgstAmount || 0;
        inputSGST += e.sgstAmount || 0;
        inputIGST += e.igstAmount || 0;
      }
    });
    const totalInputGST = inputCGST + inputSGST + inputIGST;

    const netCGSTPayable = Math.max(0, outputCGST - inputCGST);
    const netSGSTPayable = Math.max(0, outputSGST - inputSGST);
    const netIGSTPayable = Math.max(0, outputIGST - inputIGST);
    const netGSTPayable = Math.max(0, totalOutputGST - totalInputGST);
    const excessCredit = Math.max(0, totalInputGST - totalOutputGST);

    return {
      outputCGST,
      outputSGST,
      outputIGST,
      totalOutputGST,
      inputCGST,
      inputSGST,
      inputIGST,
      totalInputGST,
      netCGSTPayable,
      netSGSTPayable,
      netIGSTPayable,
      netGSTPayable,
      excessCredit,
    };
  }, [filteredInvoices, filteredPurchases, filteredExpenses]);

  // --- 3. DUES (RECEIVABLES & PAYABLES) ---
  const dues = useMemo(() => {
    // Customer Receivables (pending invoices)
    const receivablesByClient: Record<string, { client: Client; amount: number; count: number; oldestDate: string }> = {};
    invoices.filter((i) => i.status === 'pending').forEach((inv) => {
      const clientId = inv.clientId || 'unknown';
      if (!receivablesByClient[clientId]) {
        receivablesByClient[clientId] = {
          client: inv.client || { id: clientId, name: 'Client', phone: '', billingAddress: '', createdAt: '' },
          amount: 0,
          count: 0,
          oldestDate: inv.date,
        };
      }
      receivablesByClient[clientId].amount += inv.grandTotal;
      receivablesByClient[clientId].count += 1;
      if (inv.date < receivablesByClient[clientId].oldestDate) {
        receivablesByClient[clientId].oldestDate = inv.date;
      }
    });

    // Supplier Payables (pending purchases)
    const payablesBySupplier: Record<string, { supplier: Supplier; amount: number; count: number; oldestDate: string }> = {};
    purchases.filter((p) => p.status === 'pending').forEach((pur) => {
      const supId = pur.supplierId || 'unknown';
      if (!payablesBySupplier[supId]) {
        payablesBySupplier[supId] = {
          supplier: pur.supplierData || { id: supId, name: 'Vendor', phone: '', address: '', createdAt: '' },
          amount: 0,
          count: 0,
          oldestDate: pur.date,
        };
      }
      payablesBySupplier[supId].amount += pur.grandTotal;
      payablesBySupplier[supId].count += 1;
      if (pur.date < payablesBySupplier[supId].oldestDate) {
        payablesBySupplier[supId].oldestDate = pur.date;
      }
    });

    const totalReceivables = Object.values(receivablesByClient).reduce((sum, c) => sum + c.amount, 0);
    const totalPayables = Object.values(payablesBySupplier).reduce((sum, s) => sum + s.amount, 0);

    return {
      receivables: Object.values(receivablesByClient),
      payables: Object.values(payablesBySupplier),
      totalReceivables,
      totalPayables,
    };
  }, [invoices, purchases]);

  // CSV Export Helper
  const downloadCSV = (filename: string, rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerHaptic('success');
  };

  const exportSalesRegisterCSV = () => {
    const headers = ['Invoice #', 'Date', 'Customer Name', 'Phone', 'GSTIN', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Amount', 'Status'];
    const rows = filteredInvoices.map((i) => [
      i.invoiceNumber,
      i.date,
      i.client?.name || '',
      i.client?.phone || '',
      i.client?.gstin || '',
      i.subtotal - (i.discountAmount || 0),
      i.cgstAmount || 0,
      i.sgstAmount || 0,
      i.igstAmount || 0,
      i.grandTotal,
      i.status.toUpperCase(),
    ]);
    downloadCSV(`Sales_Register_${selectedFY}.csv`, [headers, ...rows]);
  };

  const exportPurchasesRegisterCSV = () => {
    const headers = ['Purchase #', 'Date', 'Vendor Name', 'Phone', 'GSTIN', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Amount', 'Status'];
    const rows = filteredPurchases.map((p) => [
      p.purchaseNumber,
      p.date,
      p.supplierData?.name || '',
      p.supplierData?.phone || '',
      p.supplierData?.gstin || '',
      p.subtotal - (p.discountAmount || 0),
      p.cgstAmount || 0,
      p.sgstAmount || 0,
      p.igstAmount || 0,
      p.grandTotal,
      p.status.toUpperCase(),
    ]);
    downloadCSV(`Purchase_Register_${selectedFY}.csv`, [headers, ...rows]);
  };

  const exportExpensesCSV = () => {
    const headers = ['Date', 'Category', 'Description', 'Vendor', 'Amount', 'GST Included', 'GST ITC Amount', 'Payment Mode'];
    const rows = filteredExpenses.map((e) => [
      e.date,
      e.category,
      e.description || '',
      e.vendor || '',
      e.amount,
      e.gstApplicable ? 'Yes' : 'No',
      e.gstAmount || 0,
      e.paymentMode || 'Cash',
    ]);
    downloadCSV(`Expense_Register_${selectedFY}.csv`, [headers, ...rows]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="title-md">Reports & Accounting</h2>
          <p className="text-muted text-xs">P&L, GST, balance sheets, CA tax packages</p>
        </div>

        {/* FY Selector */}
        <select
          className="form-select"
          style={{ width: '120px', height: '36px', fontSize: '0.78rem' }}
          value={selectedFY}
          onChange={(e) => setSelectedFY(e.target.value)}
        >
          <option value="all">All FY</option>
          {availableFYs.map((fy) => (
            <option key={fy} value={fy}>{fy}</option>
          ))}
        </select>
      </div>

      {/* Nav Tabs Bar */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
        }}
      >
        <button
          type="button"
          className={`btn ${reportTab === 'pnl' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
          onClick={() => {
            setReportTab('pnl');
            triggerHaptic('light');
          }}
        >
          Profit & Loss
        </button>

        <button
          type="button"
          className={`btn ${reportTab === 'gst' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
          onClick={() => {
            setReportTab('gst');
            triggerHaptic('light');
          }}
        >
          GST Summary
        </button>

        <button
          type="button"
          className={`btn ${reportTab === 'dues' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
          onClick={() => {
            setReportTab('dues');
            triggerHaptic('light');
          }}
        >
          Dues & Balances
        </button>

        <button
          type="button"
          className={`btn ${reportTab === 'registers' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
          onClick={() => {
            setReportTab('registers');
            triggerHaptic('light');
          }}
        >
          Registers
        </button>

        <button
          type="button"
          className={`btn ${reportTab === 'ca' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
          onClick={() => {
            setReportTab('ca');
            triggerHaptic('light');
          }}
        >
          CA / Tax Export
        </button>
      </div>

      {/* --- TAB 1: PROFIT & LOSS --- */}
      {reportTab === 'pnl' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Net Profit Big Banner */}
          <div
            className="card"
            style={{
              padding: '16px',
              marginBottom: 0,
              background: pnl.netProfit >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              borderLeft: pnl.netProfit >= 0 ? '4px solid #10b981' : '4px solid #ef4444',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Net Profit / (Loss)
            </div>
            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 900,
                marginTop: '4px',
                color: pnl.netProfit >= 0 ? '#10b981' : '#ef4444',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {pnl.netProfit >= 0 ? `+${formatCurrency(pnl.netProfit)}` : formatCurrency(pnl.netProfit)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Profit Margin: <strong>{pnl.profitMargin.toFixed(1)}%</strong>
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
            <h3 className="title-sm" style={{ marginBottom: '12px' }}>Revenue & Costs Breakdown</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>1. Total Sales (Revenue)</span>
                <span style={{ fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                  +{formatCurrency(pnl.totalSales)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>2. Total Purchases (COGS)</span>
                <span style={{ fontWeight: 800, color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                  -{formatCurrency(pnl.totalPurchases)}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderTop: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  fontWeight: 700,
                }}
              >
                <span>Gross Profit</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: pnl.grossProfit >= 0 ? '#10b981' : '#ef4444' }}>
                  {formatCurrency(pnl.grossProfit)}
                </span>
              </div>

              <div style={{ marginTop: '4px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  3. Operating Expenses:
                </div>
                {Object.keys(pnl.expenseByCategory).length === 0 ? (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic', paddingLeft: '8px' }}>
                    No expenses recorded in this period
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
                    {Object.entries(pnl.expenseByCategory).map(([cat, amt]) => (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>&bull; {cat}</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(amt)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--border)', fontWeight: 600 }}>
                  <span>Total Expenses</span>
                  <span style={{ color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                    -{formatCurrency(pnl.totalExpenseAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: GST SUMMARY --- */}
      {reportTab === 'gst' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Net GST Payable Card */}
          <div
            className="card"
            style={{
              padding: '16px',
              marginBottom: 0,
              background: 'rgba(59, 130, 246, 0.08)',
              borderLeft: '4px solid #3b82f6',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Estimated Net GST Payable to Govt
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#3b82f6', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(gst.netGSTPayable)}
            </div>
            {gst.excessCredit > 0 && (
              <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '4px' }}>
                Excess Input Credit Available: {formatCurrency(gst.excessCredit)}
              </div>
            )}
          </div>

          {/* Output vs Input Side by Side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="card" style={{ padding: '12px', marginBottom: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                Output GST (Sales)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CGST:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(gst.outputCGST)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>SGST:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(gst.outputSGST)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>IGST:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(gst.outputIGST)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '4px', marginTop: '4px', fontWeight: 700, color: 'var(--text-main)' }}>
                  <span>Total Output:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(gst.totalOutputGST)}</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '12px', marginBottom: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', marginBottom: '8px' }}>
                Input Tax Credit (ITC)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CGST:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(gst.inputCGST)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>SGST:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(gst.inputSGST)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>IGST:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(gst.inputIGST)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '4px', marginTop: '4px', fontWeight: 700, color: '#10b981' }}>
                  <span>Total ITC:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(gst.totalInputGST)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: DUES & BALANCES --- */}
      {reportTab === 'dues' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="card" style={{ padding: '12px', marginBottom: 0, borderLeft: '4px solid #10b981' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Customers Owe You
              </span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(dues.totalReceivables)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                {dues.receivables.length} customers with pending bills
              </div>
            </div>

            <div className="card" style={{ padding: '12px', marginBottom: 0, borderLeft: '4px solid #ef4444' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                You Owe Suppliers
              </span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(dues.totalPayables)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                {dues.payables.length} suppliers to be paid
              </div>
            </div>
          </div>

          {/* Customer Receivables List */}
          <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
            <h3 className="title-sm" style={{ marginBottom: '10px' }}>Customer Outstanding (Receivables)</h3>
            {dues.receivables.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                No pending customer dues! All invoices are cleared.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dues.receivables.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'var(--surface-sunken)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.client.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {item.count} pending bill{item.count > 1 ? 's' : ''} &bull; Oldest: {formatDate(item.oldestDate)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                        {formatCurrency(item.amount)}
                      </span>
                      {item.client.phone && (
                        <a
                          href={`https://wa.me/91${item.client.phone.replace(/[^0-9]/g, '')}?text=Dear%20${encodeURIComponent(item.client.name)},%20gentle%20reminder%20that%20payment%20of%20₹${item.amount}%20is%20pending.%20Thank%20you!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="icon-button"
                          style={{ width: '28px', height: '28px', color: '#10b981' }}
                          title="Remind on WhatsApp"
                          onClick={() => triggerHaptic('light')}
                        >
                          <MessageCircle size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supplier Payables List */}
          <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
            <h3 className="title-sm" style={{ marginBottom: '10px' }}>Supplier Outstanding (Payables)</h3>
            {dues.payables.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                No pending vendor bills! All purchases are cleared.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dues.payables.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'var(--surface-sunken)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.supplier.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {item.count} bill{item.count > 1 ? 's' : ''} &bull; Oldest: {formatDate(item.oldestDate)}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontWeight: 800, color: '#ef4444', fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4: REGISTERS --- */}
      {reportTab === 'registers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
            <h3 className="title-sm" style={{ marginBottom: '8px' }}>Day Book / Register Summaries</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Complete record of transactions for FY {selectedFY === 'all' ? 'All' : selectedFY}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--surface-sunken)', borderRadius: '6px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Sales Register</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{filteredInvoices.length} invoices</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                    {formatCurrency(filteredInvoices.reduce((s, i) => s + i.grandTotal, 0))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '2px 8px', marginTop: '4px' }}
                    onClick={exportSalesRegisterCSV}
                  >
                    <Download size={11} /> CSV
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--surface-sunken)', borderRadius: '6px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Purchase Register</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{filteredPurchases.length} purchase bills</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ef4444' }}>
                    {formatCurrency(filteredPurchases.reduce((s, p) => s + p.grandTotal, 0))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '2px 8px', marginTop: '4px' }}
                    onClick={exportPurchasesRegisterCSV}
                  >
                    <Download size={11} /> CSV
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--surface-sunken)', borderRadius: '6px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Expense Register</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{filteredExpenses.length} expense items</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                    {formatCurrency(filteredExpenses.reduce((s, e) => s + e.amount + (e.gstAmount || 0), 0))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '2px 8px', marginTop: '4px' }}
                    onClick={exportExpensesCSV}
                  >
                    <Download size={11} /> CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: CA / TAX EXPORT --- */}
      {reportTab === 'ca' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ padding: '16px', marginBottom: 0 }}>
            <h3 className="title-md" style={{ marginBottom: '6px' }}>Export for CA / Accountant</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              One-click download of all data in formats your Chartered Accountant can directly import into Tally or GST offline tool.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary btn-full"
                style={{ height: '42px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={exportSalesRegisterCSV}
              >
                <Download size={16} /> Download Sales Register (GSTR-1) CSV
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-full"
                style={{ height: '42px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={exportPurchasesRegisterCSV}
              >
                <Download size={16} /> Download Purchase Register (GSTR-2B) CSV
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-full"
                style={{ height: '42px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={exportExpensesCSV}
              >
                <Download size={16} /> Download Expense Register CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
