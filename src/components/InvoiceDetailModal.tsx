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
    setDownloading(true);
    try {
      const invoiceElement = document.getElementById('modal-invoice-render');
      if (!invoiceElement) {
        alert('Invoice render element not found');
        return;
      }

      // Render invoice to high-resolution canvas with desktop window simulation
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Fit cleanly onto a single A4 page if within threshold
      if (imgHeight <= pageHeight * 1.15) {
        const scale = Math.min(1, pageHeight / imgHeight);
        const renderWidth = imgWidth * scale;
        const renderHeight = imgHeight * scale;
        const xOffset = (pageWidth - renderWidth) / 2;

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', xOffset, 0, renderWidth, renderHeight, undefined, 'FAST');
      } else {
        // Multi-page slicing for longer invoices
        const pageCanvasHeight = Math.floor(canvas.width * (pageHeight / imgWidth));
        const totalPages = Math.ceil(canvas.height / pageCanvasHeight);

        for (let page = 0; page < totalPages; page++) {
          const sourceY = page * pageCanvasHeight;
          const currentSliceHeight = Math.min(pageCanvasHeight, canvas.height - sourceY);

          // Skip tiny trailing margins (< 20px) to prevent blank pages
          if (currentSliceHeight < 20 && page > 0) continue;

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

          const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
          const sliceMmHeight = (currentSliceHeight * imgWidth) / canvas.width;

          if (page > 0) {
            pdf.addPage();
          }
          pdf.addImage(sliceData, 'JPEG', 0, 0, imgWidth, sliceMmHeight, undefined, 'FAST');
        }
      }

      const cleanInvNum = (invoice.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `Invoice_${cleanInvNum}.pdf`;

      // Check if running inside Capacitor Android / iOS Native App
      const { Capacitor } = await import('@capacitor/core');

      if (Capacitor.isNativePlatform()) {
        try {
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          const { Share } = await import('@capacitor/share');

          // Extract base64 without prefix
          const dataUri = pdf.output('datauristring');
          const base64Data = dataUri.split(',')[1];

          // 1. Write file to device Cache
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
          });

          // 2. Open Native Share sheet (provides Save to Drive/Files, Open with PDF Viewer, WhatsApp, etc.)
          await Share.share({
            title: fileName,
            url: savedFile.uri,
            dialogTitle: 'Save or Open Invoice PDF',
          });
        } catch (nativeErr) {
          console.error('Native PDF save error', nativeErr);
          alert('PDF generated. Opening print dialog fallback.');
          window.print();
        }
      } else {
        // Desktop / Mobile Web Browser
        try {
          pdf.save(fileName);
        } catch {
          const blob = pdf.output('blob');
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          }, 2000);
        }
      }
    } catch (e: any) {
      console.error('PDF generation error', e);
      alert('Could not generate PDF: ' + (e?.message || 'Please try again.'));
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareText = `*Tax Invoice from ${settings.name}*\n` +
      `Bill #: ${invoice.invoiceNumber}\n` +
      `Client: ${invoice.client?.name}\n` +
      `Amount: ${formatCurrency(invoice.grandTotal)}\n` +
      `Date: ${invoice.date}\n` +
      (settings.upiId ? `Pay via UPI: ${settings.upiId}\n` : '');

    try {
      const { Capacitor } = await import('@capacitor/core');
      const { Share } = await import('@capacitor/share');

      if (Capacitor.isNativePlatform()) {
        try {
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          const cleanInvNum = (invoice.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9_-]/g, '_');
          const fileName = `Invoice_${cleanInvNum}.pdf`;
          const uriResult = await Filesystem.getUri({
            path: fileName,
            directory: Directory.Cache,
          });
          if (uriResult?.uri) {
            await Share.share({
              title: `Invoice ${invoice.invoiceNumber}`,
              text: shareText,
              url: uriResult.uri,
              dialogTitle: 'Share Invoice with Client',
            });
            return;
          }
        } catch {
          // Fall through to text share if PDF file was not previously generated
        }
      }

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
        style={{ maxWidth: '800px', width: '100%', maxHeight: '95vh' }}
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
            <span>{downloading ? 'PDF...' : 'PDF'}</span>
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
              onToggleStatus(invoice);
            }}
            style={{ fontSize: '0.75rem', padding: '6px' }}
          >
            {invoice.status === 'paid' ? <Clock size={13} color="#f59e0b" /> : <CheckCircle2 size={13} color="#10b981" />}
            <span>{invoice.status === 'paid' ? 'Unpay' : 'Paid'}</span>
          </button>
        </div>

        {/* Invoice View Area with Smooth Touch Scroll */}
        <div className="invoice-preview-container">
          <div className="invoice-preview-scroll-hint">
            <span>↔ Scroll horizontally to view full invoice</span>
          </div>
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
