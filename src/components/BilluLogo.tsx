import React from 'react';

interface BilluLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
  animated?: boolean;
}

export function BilluLogo({
  size = 48,
  className = '',
  withGlow = false,
  animated = false,
}: BilluLogoProps) {
  const glowStyle = withGlow
    ? {
        filter: 'drop-shadow(0 10px 24px rgba(37, 99, 235, 0.45)) drop-shadow(0 2px 6px rgba(59, 130, 246, 0.3))',
      }
    : undefined;

  return (
    <div
      className={`billu-logo-container ${className} ${animated ? 'billu-logo-pulse' : ''}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none',
        flexShrink: 0,
        ...glowStyle,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          {/* Main Squircle Background Gradient */}
          <linearGradient id="billuPrimaryGrad" x1="12" y1="8" x2="112" y2="112" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="42%" stopColor="#1D4ED8" />
            <stop offset="85%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Electric Cyan/Indigo Highlight Ring */}
          <linearGradient id="billuBorderGrad" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0.1" />
          </linearGradient>

          {/* Bill Document Fold Gradient */}
          <linearGradient id="billuFoldGrad" x1="42" y1="28" x2="94" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E0E7FF" />
          </linearGradient>

          {/* Dynamic Lightning / Energy Accent */}
          <linearGradient id="billuEnergyGrad" x1="48" y1="44" x2="88" y2="88" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="60%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>

          {/* Top Glass Luster */}
          <linearGradient id="billuGlassLuster" x1="30" y1="12" x2="90" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Soft Shadow behind glyph */}
          <filter id="billuGlyphShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Squircle App Icon Base */}
        <rect
          x="6"
          y="6"
          width="108"
          height="108"
          rx="28"
          fill="url(#billuPrimaryGrad)"
        />

        {/* Ambient Top Glow / Glass Sheen */}
        <path
          d="M6 34C6 18.536 18.536 6 34 6H86C101.464 6 114 18.536 114 34V46C74 42 36 50 6 62V34Z"
          fill="url(#billuGlassLuster)"
        />

        {/* Icon Border Stroke */}
        <rect
          x="6.75"
          y="6.75"
          width="106.5"
          height="106.5"
          rx="27.25"
          stroke="url(#billuBorderGrad)"
          strokeWidth="1.5"
        />

        {/* Stylized Modern "B" Geometric Invoicing Mark */}
        <g filter="url(#billuGlyphShadow)">
          {/* Left Anchor Pillar (Stem of 'B') */}
          <rect
            x="30"
            y="26"
            width="12"
            height="68"
            rx="6"
            fill="url(#billuFoldGrad)"
          />

          {/* Upper Invoice Loop with notch fold */}
          <path
            d="M38 26H64C73.941 26 82 34.059 82 44C82 53.941 73.941 62 64 62H38V26Z"
            fill="url(#billuFoldGrad)"
            fillOpacity="0.95"
          />

          {/* Upper Inner Cutout */}
          <rect
            x="46"
            y="36"
            width="22"
            height="16"
            rx="5"
            fill="#1D4ED8"
          />

          {/* Lower Dynamic Payment Arc & Fold (Lower Loop of 'B') */}
          <path
            d="M38 56H68C78.493 56 87 64.507 87 75C87 85.493 78.493 94 68 94H38V56Z"
            fill="url(#billuEnergyGrad)"
          />

          {/* Lower Inner Cutout */}
          <rect
            x="46"
            y="66"
            width="27"
            height="18"
            rx="6"
            fill="#0F172A"
          />

          {/* Dynamic Lightning / Forward Checkmark Accent */}
          <path
            d="M62 46L54 65H65L58 82L78 61H67L74 46H62Z"
            fill="#FFFFFF"
            opacity="0.96"
          />
        </g>
      </svg>
    </div>
  );
}
