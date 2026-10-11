'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, Upload, PenTool } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils';

interface SignaturePadProps {
  onSave: (dataUrl: string, type: 'drawn' | 'uploaded') => void;
  initialData?: string;
  signatoryName?: string;
  onSignatoryNameChange?: (name: string) => void;
}

export function SignaturePad({
  onSave,
  initialData,
  signatoryName = '',
  onSignatoryNameChange,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(Boolean(initialData));
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [previewImage, setPreviewImage] = useState<string>(initialData || '');

  // Initialize canvas DPI and scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // If initial drawn image exists
    if (initialData && mode === 'draw') {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = initialData;
    }
  }, [mode, initialData]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
    triggerHaptic('light');
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setPreviewImage(dataUrl);
    onSave(dataUrl, 'drawn');
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setPreviewImage('');
    onSave('', 'drawn');
    triggerHaptic('medium');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPreviewImage(base64);
        setHasDrawn(true);
        onSave(base64, 'uploaded');
        triggerHaptic('success');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'draw' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('draw')}
          >
            <PenTool size={14} /> Draw Signature
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('upload')}
          >
            <Upload size={14} /> Upload Image
          </button>
        </div>

        {mode === 'draw' && (
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={clearCanvas}
            title="Clear signature"
          >
            <Eraser size={14} /> Clear
          </button>
        )}
      </div>

      {mode === 'draw' ? (
        <div className="signature-container">
          <canvas
            ref={canvasRef}
            className="signature-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <div className="signature-controls">
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
              ✍️ Sign inside the box using your finger or stylus
            </span>
            {hasDrawn && (
              <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <Check size={14} /> Captured
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          border: '2px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          textAlign: 'center',
          background: 'var(--bg-input)'
        }}>
          {previewImage ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt="Signature Preview"
                style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain', background: '#fff', padding: '6px', borderRadius: '8px' }}
              />
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => {
                  setPreviewImage('');
                  onSave('', 'uploaded');
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Upload size={28} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Click to upload signature photo or official stamp
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>
      )}

      {onSignatoryNameChange && (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Authorized Signatory Name / Title</label>
          <input
            type="text"
            className="form-input"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            placeholder="e.g. John Doe (Director)"
            value={signatoryName}
            onChange={(e) => onSignatoryNameChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
