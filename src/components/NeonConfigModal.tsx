'use client';

import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertTriangle, RefreshCw, X, ExternalLink } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils';

interface NeonConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (connected: boolean) => void;
}

export function NeonConfigModal({ isOpen, onClose, onStatusChange }: NeonConfigModalProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    message?: string;
    version?: string;
    time?: string;
  } | null>(null);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db-status');
      const data = await res.json();
      setStatus(data);
      onStatusChange(Boolean(data.connected));
      if (data.connected) {
        triggerHaptic('success');
      } else {
        triggerHaptic('warning');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus({
        connected: false,
        message: 'Could not connect to API server: ' + msg,
      });
      onStatusChange(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={22} color="var(--primary)" />
            <h2 className="title-md">Neon Serverless DB</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: status?.connected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
            border: `1px solid ${status?.connected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            {status?.connected ? (
              <CheckCircle size={22} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <AlertTriangle size={22} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                {status?.connected ? 'Neon PostgreSQL Connected' : 'Local Fast Storage (Neon Ready)'}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {status?.message || 'Checking status...'}
              </p>
              {status?.version && (
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  PostgreSQL Version: {status.version.split(' ')[0]}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px', background: 'var(--bg-secondary)' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
            How to Connect Your Neon DB:
          </h3>
          <ol style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '18px', lineHeight: 1.6 }}>
            <li>Create a free serverless project at <strong>neon.tech</strong>.</li>
            <li>Copy your connection string: <code>postgres://user:pass@ep-...neon.tech/neondb?sslmode=require</code></li>
            <li>Add it to your <code>.env.local</code> in project root:
              <pre style={{
                background: '#090d16',
                padding: '8px',
                borderRadius: '6px',
                marginTop: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: '#38bdf8',
                overflowX: 'auto'
              }}>
                DATABASE_URL=postgres://...neon.tech/neondb
              </pre>
            </li>
            <li>Tap <strong>Test & Sync Schema</strong> below. All tables and migrations are initialized automatically!</li>
          </ol>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={checkConnection}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            {loading ? 'Testing Connection...' : 'Test & Sync Schema'}
          </button>
          <a
            href="https://neon.tech"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ textDecoration: 'none' }}
          >
            <ExternalLink size={16} /> Neon
          </a>
        </div>
      </div>
    </div>
  );
}
