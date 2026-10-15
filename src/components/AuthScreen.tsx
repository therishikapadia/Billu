'use client';

import React, { useState } from 'react';
import { User } from '@/lib/types';
import { triggerHaptic } from '@/lib/utils';
import { BilluLogo } from './BilluLogo';
import {
  Lock,
  Mail,
  User as UserIcon,
  Building,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: User, token: string) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    triggerHaptic('light');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const payload =
        mode === 'login'
          ? { email: email.trim(), password }
          : {
              email: email.trim(),
              password,
              name: name.trim(),
              companyName: companyName.trim() || undefined,
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please try again.');
      }

      triggerHaptic('success');
      setSuccessMsg(mode === 'login' ? 'Signed in successfully!' : 'Account created successfully!');
      
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
      }, 400);
    } catch (err: unknown) {
      triggerHaptic('error');
      const msg = err instanceof Error ? err.message : 'An error occurred during authentication';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 auto',
        }}
      >
        {/* App Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', marginBottom: '14px' }}>
            <BilluLogo size={62} withGlow />
          </div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.025em',
            }}
          >
            Billu
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              marginTop: '4px',
            }}
          >
            Secure, Multi-Tenant Invoicing & Product Suite
          </p>
        </div>

        {/* Card Container */}
        <div
          className="card"
          style={{
            padding: '24px',
            borderRadius: '20px',
            boxShadow: '0 12px 30px -8px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '20px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setMode('login');
                setError(null);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                background: mode === 'login' ? '#ffffff' : 'transparent',
                color: mode === 'login' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setMode('signup');
                setError(null);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                background: mode === 'signup' ? '#ffffff' : 'transparent',
                color: mode === 'signup' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: mode === 'signup' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Create Account
            </button>
          </div>

          {/* Error & Success Alerts */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '0.8rem',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                color: '#16a34a',
                fontSize: '0.8rem',
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'signup' && (
              <>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>
                    Full Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Verma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '34px' }}
                    />
                    <UserIcon
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '11px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-dim)',
                      }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>
                    Business / Company Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="e.g. Verma Retail & Services"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '34px' }}
                    />
                    <Building
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '11px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-dim)',
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '34px' }}
                />
                <Mail
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                  }}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '34px', paddingRight: '36px' }}
                />
                <Lock
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'signup' && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                  Must be at least 6 characters
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-full"
              style={{
                marginTop: '8px',
                height: '44px',
                fontSize: '0.92rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px -2px rgba(37, 99, 235, 0.4)',
              }}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="spin" style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  <span>{mode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{mode === 'login' ? 'Sign In to Workspace' : 'Create My Account'}</span>
                  <ArrowRight size={16} />
                </div>
              )}
            </button>
          </form>

        </div>

        {/* Security & Multi-tenant Assurance Footer */}
        <div
          style={{
            marginTop: '18px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} color="#16a34a" />
            <span>Strict Tenant Isolation</span>
          </div>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={13} color="#2563eb" />
            <span>Encrypted Credentials</span>
          </div>
        </div>
      </div>
    </div>
  );
}
