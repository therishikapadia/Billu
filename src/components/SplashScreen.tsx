'use client';

import React, { useEffect, useState } from 'react';
import { BilluLogo } from './BilluLogo';

interface SplashScreenProps {
  statusText?: string;
}

export function SplashScreen({ statusText = 'Loading your workspace...' }: SplashScreenProps) {
  const [dots, setDots] = useState('');
  const [phaseIndex, setPhaseIndex] = useState(0);

  const phases = [
    'Verifying credentials...',
    'Checking database sync...',
    'Preparing your invoices...',
  ];

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);

    const phaseTimer = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % phases.length);
    }, 1200);

    return () => {
      clearInterval(dotTimer);
      clearInterval(phaseTimer);
    };
  }, [phases.length]);

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        backgroundColor: '#ffffff',
        backgroundImage: `
          radial-gradient(circle at 50% 35%, rgba(37, 99, 235, 0.08) 0%, transparent 60%),
          radial-gradient(circle at 80% 80%, rgba(14, 165, 233, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)
        `,
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Center Hero Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '360px',
          width: '100%',
        }}
      >
        {/* Animated App Logo with Neon Bloom */}
        <div style={{ marginBottom: '22px' }}>
          <BilluLogo size={76} withGlow animated />
        </div>

        {/* Brand Name & Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              color: '#0f172a',
              fontFamily: 'var(--font-sans)',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Billu
          </h1>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
              display: 'inline-block',
              marginTop: '4px',
            }}
          />
        </div>

        <p
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#64748b',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '32px',
          }}
        >
          Smart Invoicing & Billing Suite
        </p>

        {/* Shimmer Progress Track */}
        <div
          style={{
            width: '180px',
            height: '4px',
            backgroundColor: '#f1f5f9',
            borderRadius: '999px',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: '16px',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          <div
            className="splash-progress-bar"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '45%',
              background: 'linear-gradient(90deg, #2563eb, #38bdf8, #818cf8)',
              borderRadius: '999px',
            }}
          />
        </div>

        {/* Dynamic Status Text */}
        <p
          style={{
            fontSize: '0.825rem',
            color: '#64748b',
            minHeight: '20px',
            fontWeight: 500,
            margin: 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          {statusText || phases[phaseIndex]}
          {dots}
        </p>
      </div>

      {/* Modern Trust Badges Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(var(--safe-bottom) + 24px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.72rem',
            color: '#94a3b8',
            fontWeight: 500,
          }}
        >
          <span>⚡ Offline-First</span>
          <span>•</span>
          <span>🛡️ Multi-Tenant</span>
          <span>•</span>
          <span>☁️ Neon DB</span>
        </div>
        <div
          style={{
            fontSize: '0.65rem',
            color: '#cbd5e1',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.05em',
          }}
        >
          v2.4 PRODUCTION READY
        </div>
      </div>
    </div>
  );
}
