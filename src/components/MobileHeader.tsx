'use client';

import React from 'react';
import { Settings, ArrowLeft, RefreshCw, LogOut } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils';
import { User } from '@/lib/types';
import { BilluLogo } from './BilluLogo';

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onOpenSettings: () => void;
  isSettingsActive?: boolean;
  isSyncing?: boolean;
  onSync?: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
}

export function MobileHeader({
  title,
  showBack,
  onBack,
  onOpenSettings,
  isSettingsActive,
  isSyncing = false,
  onSync,
  currentUser,
  onLogout,
}: MobileHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-badge">
        {showBack && onBack ? (
          <button
            type="button"
            className="icon-button"
            onClick={() => {
              triggerHaptic('light');
              onBack();
            }}
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft size={19} />
          </button>
        ) : (
          <div title={currentUser ? `Logged in as ${currentUser.name}` : 'Billu'} style={{ display: 'flex', alignItems: 'center' }}>
            <BilluLogo size={36} />
          </div>
        )}

        <div>
          <h1 className="brand-title">{title || 'Billu'}</h1>
          <p className="brand-subtitle">
            {currentUser?.companyName || currentUser?.name || 'Smart Invoicing Suite'}
          </p>
        </div>
      </div>

      <div className="header-actions">
        {/* Cloud Sync Button */}
        {onSync && (
          <button
            type="button"
            className="icon-button"
            style={{
              color: isSyncing ? 'var(--primary)' : 'var(--text-muted)',
              backgroundColor: isSyncing ? 'var(--primary-light)' : '#ffffff',
            }}
            onClick={() => {
              triggerHaptic('light');
              onSync();
            }}
            title={isSyncing ? 'Syncing with cloud...' : 'Sync with Cloud Database'}
            aria-label="Sync Database"
            disabled={isSyncing}
          >
            <RefreshCw size={17} className={isSyncing ? 'spin' : ''} />
          </button>
        )}

        {/* Settings button in header */}
        <button
          type="button"
          className="icon-button"
          style={{
            color: isSettingsActive ? 'var(--primary)' : 'var(--text-muted)',
            borderColor: isSettingsActive ? 'var(--primary)' : 'var(--border-subtle)',
            backgroundColor: isSettingsActive ? 'var(--primary-light)' : '#ffffff',
          }}
          onClick={() => {
            triggerHaptic('light');
            onOpenSettings();
          }}
          title="Company Settings"
          aria-label="Company Settings"
        >
          <Settings size={18} />
        </button>

        {/* Logout button */}
        {currentUser && onLogout && (
          <button
            type="button"
            className="icon-button"
            style={{
              color: 'var(--text-muted)',
              borderColor: 'var(--border-subtle)',
              backgroundColor: '#ffffff',
            }}
            onClick={() => {
              triggerHaptic('warning');
              onLogout();
            }}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={17} />
          </button>
        )}
      </div>
    </header>
  );
}
