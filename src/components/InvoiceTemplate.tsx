'use client';

import React from 'react';
import { Invoice, CompanySettings } from '@/lib/types';
import { formatCurrency, formatDate, numberToIndianWords } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';

interface InvoiceTemplateProps {
  invoice: Invoice;
  settings: CompanySettings;
  id?: string;
}

export function InvoiceTemplate({ invoice, settings, id = 'invoice-print-area' }: InvoiceTemplateProps) {
  // UPI payment intent link for QR code: upi://pay?pa=upiId&pn=companyName&am=grandTotal&cu=INR
  const upiPayUrl = settings.upiId
    ? `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.name)}&am=${invoice.grandTotal}&cu=INR&tn=Invoice%20${encodeURIComponent(invoice.invoiceNumber)}`
    : '';

  const qrCodeUrl = upiPayUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=2&data=${encodeURIComponent(upiPayUrl)}`
    : '';

  return (
    <div id={id} className="invoice-sheet">
      {/* 1. Header with Company Branding & Invoice Badge */}
      <div className="invoice-header-row">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {settings.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logoUrl}
                alt={settings.name}
                style={{ height: '52px', objectFit: 'contain', borderRadius: '4px' }}
              />
            )}
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {settings.name}
              </h1>
              {settings.tagline && (
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                  {settings.tagline}
                </p>
              )}
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '10px', lineHeight: 1.4 }}>
            <p>{settings.address}, {settings.city}, {settings.state} - {settings.pincode}</p>
            <p><strong>Phone:</strong> {settings.phone} &bull; <strong>Email:</strong> {settings.email}</p>
            {settings.gstin && <p><strong>GSTIN:</strong> {settings.gstin} {settings.pan ? `| PAN: ${settings.pan}` : ''}</p>}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            borderRadius: '6px',
            fontWeight: 800,
            fontSize: '1rem',
            letterSpacing: '0.05em'
          }}>
            TAX INVOICE
          </div>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginTop: '6px' }}>
            #{invoice.invoiceNumber}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
            <strong>Date:</strong> {formatDate(invoice.date)}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
            <strong>Due Date:</strong> {formatDate(invoice.dueDate)}
          </p>
          <div style={{ marginTop: '6px' }}>
            <span style={{
              display: 'inline-block',
              padding: '2px 8px',
              fontSize: '0.7rem',
              fontWeight: 700,
              borderRadius: '999px',
              textTransform: 'uppercase',
              backgroundColor: invoice.status === 'paid' ? '#dcfce7' : invoice.status === 'draft' ? '#f1f5f9' : '#fef3c7',
              color: invoice.status === 'paid' ? '#166534' : invoice.status === 'draft' ? '#475569' : '#92400e',
              border: `1px solid ${invoice.status === 'paid' ? '#86efac' : invoice.status === 'draft' ? '#cbd5e1' : '#fde68a'}`
            }}>
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Client / Buyer Details */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        backgroundColor: '#f8fafc',
        padding: '12px 14px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        marginBottom: '16px'
      }}>
        <div>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
            BILL TO (BUYER)
          </span>
          <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
            {invoice.client?.name || 'Walk-in Customer'}
          </p>
          <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
            <p>{invoice.client?.billingAddress}</p>
            {invoice.client?.city && <p>{invoice.client?.city}, {invoice.client?.state} {invoice.client?.pincode ? `- ${invoice.client?.pincode}` : ''}</p>}
            <p><strong>Phone:</strong> {invoice.client?.phone || 'N/A'} {invoice.client?.email ? `| Email: ${invoice.client.email}` : ''}</p>
            {invoice.client?.gstin && <p><strong>GSTIN:</strong> {invoice.client.gstin}</p>}
          </div>
        </div>
      </div>

      {/* 3. Line Items Table */}
      <table className="invoice-items-table">
        <thead>
          <tr>
            <th style={{ width: '30px' }}>#</th>
            <th>Item & Description</th>
            <th style={{ textAlign: 'center' }}>HSN</th>
            <th style={{ textAlign: 'center' }}>Qty</th>
            <th style={{ textAlign: 'right' }}>Rate</th>
            <th style={{ textAlign: 'center' }}>Tax%</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{idx + 1}</td>
              <td>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                {item.description && (
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.description}</div>
                )}
              </td>
              <td style={{ textAlign: 'center', fontSize: '0.72rem', color: '#64748b' }}>
                {item.hsn || '-'}
              </td>
              <td style={{ textAlign: 'center', fontWeight: 600 }}>
                {item.quantity} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.unit}</span>
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(item.price)}
              </td>
              <td style={{ textAlign: 'center', fontSize: '0.75rem', color: '#475569' }}>
                {item.taxRate}%
              </td>
              <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 4. Financial Calculation Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        {/* Left column: Amount in words & Bank info */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Amount In Words:
            </span>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', fontStyle: 'italic', marginTop: '2px' }}>
              {numberToIndianWords(invoice.grandTotal)}
            </p>
          </div>

          {/* Payment & Bank Details */}
          {(settings.bankName || settings.upiId) && (
            <div style={{
              display: 'flex',
              gap: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '10px 12px',
              alignItems: 'center'
            }}>
              {qrCodeUrl && (
                <div style={{ textAlign: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="Scan & Pay"
                    style={{ width: '70px', height: '70px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                  <span style={{ display: 'block', fontSize: '0.6rem', color: '#64748b', fontWeight: 700, marginTop: '2px' }}>
                    Scan to Pay
                  </span>
                </div>
              )}
              <div style={{ fontSize: '0.72rem', color: '#334155', lineHeight: 1.45 }}>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>Bank Transfer Details:</strong>
                {settings.bankName && <p><strong>Bank:</strong> {settings.bankName}</p>}
                {settings.accountNumber && <p><strong>A/C No:</strong> {settings.accountNumber}</p>}
                {settings.ifsc && <p><strong>IFSC:</strong> {settings.ifsc}</p>}
                {settings.upiId && <p><strong>UPI ID:</strong> {settings.upiId}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Totals breakdown */}
        <div style={{ width: '220px' }} className="invoice-totals-box">
          <div className="invoice-total-row">
            <span>Subtotal:</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(invoice.subtotal)}</span>
          </div>

          {invoice.discountAmount > 0 && (
            <div className="invoice-total-row" style={{ color: '#059669' }}>
              <span>Discount ({invoice.discountType === 'percent' ? `${invoice.discountValue}%` : 'Flat'}):</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>- {formatCurrency(invoice.discountAmount)}</span>
            </div>
          )}

          {invoice.taxType === 'GST_INTRA_STATE' ? (
            <>
              <div className="invoice-total-row">
                <span>CGST:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(invoice.cgstAmount || invoice.taxAmount / 2)}</span>
              </div>
              <div className="invoice-total-row">
                <span>SGST:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(invoice.sgstAmount || invoice.taxAmount / 2)}</span>
              </div>
            </>
          ) : (
            <div className="invoice-total-row">
              <span>IGST (Inter-State):</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(invoice.igstAmount || invoice.taxAmount)}</span>
            </div>
          )}

          {invoice.roundOff !== 0 && (
            <div className="invoice-total-row">
              <span>Round Off:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(invoice.roundOff)}</span>
            </div>
          )}

          <div className="invoice-grand-total">
            <span>Grand Total:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#4f46e5' }}>
              {formatCurrency(invoice.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Terms & Authorized Signature */}
      <div style={{
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: '20px'
      }}>
        <div style={{ flex: 1, fontSize: '0.72rem', color: '#64748b', maxWidth: '320px' }}>
          <strong>Terms & Conditions:</strong>
          <p style={{ whiteSpace: 'pre-line', marginTop: '4px' }}>
            {invoice.terms || settings.terms}
          </p>
          {invoice.notes && (
            <p style={{ marginTop: '6px', color: '#475569', fontStyle: 'italic' }}>
              Note: {invoice.notes}
            </p>
          )}
        </div>

        {/* Digital Signature box */}
        <div style={{ textAlign: 'center', minWidth: '150px' }}>
          {invoice.signatureData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={invoice.signatureData}
              alt="Authorized Signature"
              style={{ maxHeight: '60px', maxWidth: '140px', objectFit: 'contain', marginBottom: '4px' }}
            />
          ) : settings.signatureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.signatureUrl}
              alt="Authorized Signature"
              style={{ maxHeight: '60px', maxWidth: '140px', objectFit: 'contain', marginBottom: '4px' }}
            />
          ) : (
            <div style={{
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: '0.7rem'
            }}>
              <ShieldCheck size={18} style={{ marginRight: '4px' }} /> Verified
            </div>
          )}
          <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b' }}>
            {invoice.signatoryName || 'Authorized Signatory'}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
            For {settings.name}
          </div>
        </div>
      </div>
    </div>
  );
}
