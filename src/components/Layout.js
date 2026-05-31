import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '⬡', exact: true },
  { to: '/officers', label: 'Personnel', icon: '👮' },
  { to: '/duties', label: 'Duty Types', icon: '📋' },
  { to: '/config', label: 'Configuration', icon: '⚙' },
  { to: '/generate', label: 'AI Generate', icon: '🤖' },
  { to: '/roster', label: 'Roster View', icon: '📅' },
];

const styles = {
  wrapper: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 220, background: 'rgba(10,15,30,0.98)', borderRight: '1px solid rgba(99,179,237,0.12)',
    display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
  },
  logo: {
    padding: '20px 18px 16px', borderBottom: '1px solid rgba(99,179,237,0.1)',
  },
  badge: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, boxShadow: '0 0 16px rgba(245,158,11,0.35)', marginBottom: 10,
  },
  logoTitle: { fontFamily: 'Rajdhani, sans-serif', fontSize: 16, fontWeight: 700, letterSpacing: 2, color: '#fff', lineHeight: 1 },
  logoSub: { fontSize: 10, color: 'var(--text3)', letterSpacing: 1, marginTop: 3 },
  nav: { padding: '12px 8px', flex: 1 },
  navSection: { fontSize: 9, fontWeight: 600, letterSpacing: 2, color: 'var(--text3)', padding: '10px 10px 6px', textTransform: 'uppercase' },
  navLink: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
    borderRadius: 4, marginBottom: 2, textDecoration: 'none', fontSize: 13,
    color: 'var(--text2)', transition: 'all .15s', fontWeight: 500,
  },
  navLinkActive: { background: 'rgba(37,99,235,0.18)', color: 'var(--cyan)', borderLeft: '2px solid var(--cyan)' },
  footer: { padding: '14px 18px', borderTop: '1px solid rgba(99,179,237,0.1)' },
  statusRow: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'var(--green)', fontFamily: 'IBM Plex Mono, monospace' },
  main: { flex: 1, padding: '24px 28px', overflowX: 'hidden', maxWidth: '100%' },
};

export default function Layout({ children }) {
  const { officers, dutyTypes, activeRoster } = useApp();
  const location = useLocation();

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.badge}>🏛️</div>
          <div style={styles.logoTitle}>ROSTER COMMAND</div>
          <div style={styles.logoSub}>AI Duty Management</div>
        </div>

        <nav style={styles.nav}>
          <div style={styles.navSection}>Navigation</div>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={styles.footer}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 8, letterSpacing: 1 }}>
            SYSTEM STATUS
          </div>
          <div style={styles.statusRow}>
            <div className="pulse-dot" />
            ONLINE
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{officers.length}</span> officers
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{dutyTypes.length}</span> duties
            </div>
          </div>
        </div>
      </aside>

      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}