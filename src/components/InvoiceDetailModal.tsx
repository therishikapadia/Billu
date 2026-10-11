'use client';

import React, { useState } from 'react';
import { Invoice, CompanySettings } from '@/lib/types';
import { InvoiceTemplate } from './InvoiceTemplate';
import { triggerHaptic, formatCurrency } from '@/lib/utils';
import { Download, Share2, Printer, CheckCircle2, Clock, X, MessageSquare, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  settings: CompanySettings;
  onClose: () => void;
  onToggleStatus: (invoice: Invoice) => void;
}

export function InvoiceDetailModal({
  invoice,
  settings,
  onClose,
  onToggleStatus,
}: InvoiceDetailModalProps) {
  const [downloading, setDownloading] = useState(false);

  if (!invoice) return null;

  const handleDownloadPdf = async () => {
    triggerHaptic('medium');
    setDownloading(true);
    try {
      const invoiceElement = document.getElementById('modal-invoice-render');
      if (!invoiceElement) return;

      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pageHeight) {
        // Fits entirely on a single A4 page
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      } else {
        // Multi-page invoice: Slice canvas into precise A4 page chunks
        // Compute pixel height corresponding to one A4 page
        const pageCanvasHeight = Math.floor(canvas.width * (pageHeight / imgWidth));
        const totalPages = Math.ceil(canvas.height / pageCanvasHeight);

        for (let page = 0; page < totalPages; page++) {
          const sourceY = page * pageCanvasHeight;
          const currentSliceHeight = Math.min(pageCanvasHeight, canvas.height - sourceY);

          // Skip tiny trailing margins (< 25px) to prevent blank pages
          if (currentSliceHeight < 25 && page > 0) continue;

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = currentSliceHeight;

          const sliceCtx = sliceCanvas.getContext('2d');
          if (sliceCtx) {
            sliceCtx.fillStyle = '#ffffff';
            sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            sliceCtx.drawImage(
              canvas,
              0, sourceY, canvas.width, currentSliceHeight,
              0, 0, sliceCanvas.width, currentSliceHeight
            );
          }

          const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.85);
          const sliceMmHeight = (currentSliceHeight * imgWidth) / canvas.width;

          if (page > 0) {
            pdf.addPage();
          }
          pdf.addImage(sliceData, 'JPEG', 0, 0, imgWidth, sliceMmHeight, undefined, 'FAST');
        }
      }

      pdf.save(`${invoice.invoiceNumber}.pdf`);
      triggerHaptic('success');
    } catch (e) {
      console.error('PDF generation error', e);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    triggerHaptic('light');
    const shareText = `*Tax Invoice from ${settings.name}*\n` +
      `Bill #: ${invoice.invoiceNumber}\n` +
      `Client: ${invoice.client?.name}\n` +
      `Amount: ${formatCurrency(invoice.grandTotal)}\n` +
      `Date: ${invoice.date}\n` +
      (settings.upiId ? `Pay via UPI: ${settings.upiId}\n` : '');

    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title: `Invoice ${invoice.invoiceNumber}`,
        text: shareText,
        dialogTitle: 'Share Invoice with Client',
      });
    } catch {
      // Fallback to Web Share API or WhatsApp
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Invoice ${invoice.invoiceNumber}`,
            text: shareText,
          });
        } catch {
          // ignore share cancel
        }
      } else {
        // Fallback WhatsApp message
        const waPhone = invoice.client?.phone?.replace(/[^0-9]/g, '') || '';
        const waUrl = waPhone
          ? `https://wa.me/${waPhone}?text=${encodeURIComponent(shareText)}`
          : `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(waUrl, '_blank');
      }
    }
  };

  const handleWhatsApp = () => {
    triggerHaptic('light');
    const waPhone = invoice.client?.phone?.replace(/[^0-9]/g, '') || '';
    const shareText = `Hello ${invoice.client?.name},\nHere is your invoice *#${invoice.invoiceNumber}* for *${formatCurrency(invoice.grandTotal)}* from *${settings.name}*.\nThank you!`;
    const waUrl = waPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(shareText)}`
      : `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '20px' }}>
      <div
        className="modal-content"
        style={{ maxWidth: '780px', width: '100%', maxHeight: '95vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="title-md">Invoice #{invoice.invoiceNumber}</h2>
            <span className={`badge ${invoice.status === 'paid' ? 'badge-paid' : invoice.status === 'draft' ? 'badge-draft' : 'badge-pending'}`} style={{ marginTop: '4px' }}>
              {invoice.status}
            </span>
          </div>

          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handleDownloadPdf}
            disabled={downloading}
            style={{ fontSize: '0.75rem', padding: '6px' }}
          >
            {downloading ? <Loader2 size={13} className="spin" /> : <Download size={13} />}
            <span>PDF</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-accent"
            onClick={handleShare}
            style={{ fontSize: '0.75rem', padding: '6px' }}
          >
            <Share2 size={13} />
            <span>Share</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-success"
            onClick={handleWhatsApp}
            style={{ fontSize: '0.75rem', padding: '6px' }}
          >
            <MessageSquare size={13} />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => {
              triggerHaptic('light');
              onToggleStatus(invoice);
            }}
            style={{ fontSize: '0.75rem', padding: '6px' }}
          >
            {invoice.status === 'paid' ? <Clock size={13} color="#f59e0b" /> : <CheckCircle2 size={13} color="#10b981" />}
            <span>{invoice.status === 'paid' ? 'Unpay' : 'Paid'}</span>
          </button>
        </div>

        {/* Invoice View Area */}
        <div style={{ overflowX: 'auto', background: '#334155', padding: '12px', borderRadius: '12px' }}>
          <InvoiceTemplate id="modal-invoice-render" invoice={invoice} settings={settings} />
        </div>

        {/* Print Button Bottom */}
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => window.print()}
          >
            <Printer size={14} /> Print Bill
          </button>
        </div>
      </div>
    </div>
  );
}
