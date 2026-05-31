import React from 'react';

// CARD
export const Card = ({ children, accent, style = {} }) => (
  <div style={{
    background: 'var(--card)', border: '1px solid var(--border)',
    borderLeft: accent ? '3px solid var(--cyan)' : undefined,
    borderRadius: 4, padding: '18px 20px', ...style,
  }}>
    {children}
  </div>
);

// CARD HEADER
export const CardHeader = ({ icon, title, count }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
    {icon && <span>{icon}</span>}
    <h3 style={{
      fontFamily: 'Rajdhani, sans-serif', fontSize: 13, fontWeight: 700,
      letterSpacing: 1.5, color: 'var(--cyan)', textTransform: 'uppercase', flex: 1,
    }}>
      {title}
    </h3>
    {count !== undefined && (
      <span style={{
        background: 'rgba(6,182,212,0.12)', color: 'var(--cyan)',
        border: '1px solid rgba(6,182,212,0.3)', borderRadius: 20,
        fontSize: 11, fontWeight: 600, padding: '2px 9px',
      }}>
        {count}
      </span>
    )}
  </div>
);

// PAGE HEADER
export const PageHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
    <div>
      <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 26, fontWeight: 700, letterSpacing: 1, color: '#fff', lineHeight: 1.1 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

// FORM FIELD
export const Field = ({ label, children, style = {} }) => (
  <div style={{ marginBottom: 14, ...style }}>
    <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);

// INPUT
export const Input = ({ style = {}, ...props }) => (
  <input style={{
    width: '100%', background: 'rgba(10,15,30,0.85)', border: '1px solid var(--border)',
    borderRadius: 3, padding: '9px 12px', color: 'var(--text)',
    fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 13, outline: 'none',
    transition: 'border .18s', ...style,
  }}
  onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
  onBlur={e => e.target.style.borderColor = 'var(--border)'}
  {...props} />
);

// SELECT
export const Select = ({ style = {}, children, ...props }) => (
  <select style={{
    width: '100%', background: 'rgba(10,15,30,0.85)', border: '1px solid var(--border)',
    borderRadius: 3, padding: '9px 12px', color: 'var(--text)',
    fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 13, outline: 'none',
    transition: 'border .18s', cursor: 'pointer', ...style,
  }}
  onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
  onBlur={e => e.target.style.borderColor = 'var(--border)'}
  {...props}>
    {children}
  </select>
);

// TEXTAREA
export const Textarea = ({ style = {}, ...props }) => (
  <textarea style={{
    width: '100%', background: 'rgba(10,15,30,0.85)', border: '1px solid var(--border)',
    borderRadius: 3, padding: '9px 12px', color: 'var(--text)',
    fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 13, outline: 'none',
    resize: 'vertical', minHeight: 80, transition: 'border .18s', ...style,
  }}
  onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
  onBlur={e => e.target.style.borderColor = 'var(--border)'}
  {...props} />
);

// BUTTON
const BTN_STYLES = {
  primary: { background: 'linear-gradient(135deg, #2563eb, #1d6fa4)', color: '#fff', border: 'none', boxShadow: '0 0 18px rgba(37,99,235,0.3)' },
  secondary: { background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' },
  danger: { background: 'rgba(239,68,68,0.12)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.28)' },
  success: { background: 'rgba(16,185,129,0.12)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.28)' },
  ghost: { background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border)' },
};

export const Button = ({ variant = 'primary', children, style = {}, disabled, ...props }) => (
  <button
    disabled={disabled}
    style={{
      padding: '9px 18px', borderRadius: 3, cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
      transition: 'all .18s', fontFamily: 'Rajdhani, sans-serif',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      opacity: disabled ? 0.45 : 1,
      ...BTN_STYLES[variant],
      ...style,
    }}
    {...props}
  >
    {children}
  </button>
);

// STAT CARD
export const StatCard = ({ label, value, color = 'var(--cyan)', icon }) => (
  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 18px', textAlign: 'center' }}>
    {icon && <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>}
    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 5 }}>{label}</div>
  </div>
);

// BADGE / TAG
const BADGE_COLORS = {
  morning: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.28)' },
  evening: { bg: 'rgba(139,92,246,0.12)', color: '#a5b4fc', border: 'rgba(139,92,246,0.28)' },
  night: { bg: 'rgba(6,182,212,0.12)', color: '#06b6d4', border: 'rgba(6,182,212,0.28)' },
  off: { bg: 'rgba(100,116,139,0.12)', color: '#64748b', border: 'rgba(100,116,139,0.28)' },
  info: { bg: 'rgba(37,99,235,0.12)', color: '#60a5fa', border: 'rgba(37,99,235,0.28)' },
};

export const Badge = ({ label, variant = 'info', style = {} }) => {
  const c = BADGE_COLORS[variant] || BADGE_COLORS.info;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 2, fontSize: 10, fontWeight: 700,
      letterSpacing: 0.5, background: c.bg, color: c.color,
      border: `1px solid ${c.border}`, display: 'inline-block', ...style,
    }}>
      {label}
    </span>
  );
};

// GRID
export const Grid = ({ cols = 2, gap = 16, children, style = {} }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap, ...style }}>
    {children}
  </div>
);

// AVATAR
export const Avatar = ({ name, size = 34 }) => {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, color: '#fff', flexShrink: 0,
      fontFamily: 'Rajdhani, sans-serif',
    }}>
      {initials}
    </div>
  );
};

// EMPTY STATE
export const EmptyState = ({ icon, title, subtitle, action }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
    <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 18, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{title}</div>
    {subtitle && <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>{subtitle}</div>}
    {action}
  </div>
);

// ALERT
export const Alert = ({ type = 'info', children }) => {
  const colors = {
    info: { bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.25)', color: 'var(--cyan)' },
    success: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', color: 'var(--green)' },
    warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', color: 'var(--gold)' },
    danger: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', color: 'var(--red)' },
  };
  const c = colors[type];
  return (
    <div style={{ padding: '11px 14px', borderRadius: 3, fontSize: 13, background: c.bg, border: `1px solid ${c.border}`, color: c.color, marginBottom: 14 }}>
      {children}
    </div>
  );
};

// PROGRESS BAR
export const ProgressBar = ({ value, max, color = 'var(--cyan)' }) => (
  <div style={{ height: 4, background: 'rgba(99,179,237,0.08)', borderRadius: 2, overflow: 'hidden', marginTop: 6 }}>
    <div style={{ height: '100%', width: `${Math.min(100, (value / max) * 100)}%`, background: color, borderRadius: 2, transition: 'width 1s ease' }} />
  </div>
);

// DIVIDER
export const Divider = ({ style = {} }) => (
  <div style={{ height: 1, background: 'var(--border)', margin: '16px 0', ...style }} />
);