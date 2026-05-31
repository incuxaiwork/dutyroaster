import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader, StatCard, Card, CardHeader, Grid, Badge, Button, Avatar, EmptyState } from '../components/UI';

export default function Dashboard() {
  const { officers, dutyTypes, rosters, activeRoster, loading } = useApp();
  const navigate = useNavigate();

  const equityScore = () => {
    if (!activeRoster?.officer_stats?.length) return '—';
    const totals = activeRoster.officer_stats.map(s => s.total_shifts || 0);
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    const maxDev = Math.max(...totals.map(v => Math.abs(v - avg)));
    return avg > 0 ? `${Math.max(0, Math.round(100 - (maxDev / avg) * 100))}%` : '—';
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Command Dashboard"
        subtitle="AI-powered police duty roster management system"
        action={
          <Button onClick={() => navigate('/generate')} style={{ padding: '10px 22px' }}>
            🤖 Generate Roster
          </Button>
        }
      />

      <Grid cols={4} gap={14} style={{ marginBottom: 24 }}>
        <StatCard label="Officers" value={officers.length} color="var(--cyan)" icon="👮" />
        <StatCard label="Duty Types" value={dutyTypes.length} color="var(--gold)" icon="📋" />
        <StatCard label="Rosters Saved" value={rosters.length} color="var(--green)" icon="📅" />
        <StatCard label="Equity Score" value={equityScore()} color="var(--purple)" icon="⚖" />
      </Grid>

      <Grid cols={2} gap={16}>
        {/* Officers summary */}
        <Card accent>
          <CardHeader icon="👮" title="Personnel" count={officers.length} />
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {officers.length === 0 ? (
              <EmptyState icon="👤" title="No officers added" subtitle="Go to Personnel page to add officers" />
            ) : officers.map(o => (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <Avatar name={o.name} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{o.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{o.rank} · {o.specialization}</div>
                </div>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'var(--cyan)' }}>{o.id}</span>
              </div>
            ))}
          </div>
          <Button variant="secondary" onClick={() => navigate('/officers')} style={{ marginTop: 12 }}>
            Manage Officers →
          </Button>
        </Card>

        {/* Duty Types */}
        <Card accent>
          <CardHeader icon="📋" title="Duty Types" count={dutyTypes.length} />
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {dutyTypes.length === 0 ? (
              <EmptyState icon="📝" title="No duty types" subtitle="Go to Duty Types to configure shifts" />
            ) : dutyTypes.map(d => (
              <div key={d.code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <Badge label={d.code} variant={d.color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {d.startTime ? `${d.startTime} – ${d.endTime}` : 'No fixed time'} · Priority {d.priority}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="secondary" onClick={() => navigate('/duties')} style={{ marginTop: 12 }}>
            Manage Duties →
          </Button>
        </Card>

        {/* Latest Roster Summary */}
        {activeRoster && (
          <Card accent style={{ gridColumn: '1 / -1' }}>
            <CardHeader icon="📅" title={`Latest Roster — ${activeRoster.config?.stationName || 'Station'}`} />
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>{activeRoster.summary}</div>
            {activeRoster.alerts?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {activeRoster.alerts.map((a, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--gold)', padding: '4px 0' }}>⚠ {a}</div>
                ))}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {(activeRoster.officer_stats || []).slice(0, 8).map(s => (
                <div key={s.officer_id} style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 3, padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{s.officer_name}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Badge label={`${s.total_shifts} shifts`} variant="info" style={{ fontSize: 9 }} />
                    <Badge label={`${s.night_shifts} nights`} variant="night" style={{ fontSize: 9 }} />
                    <Badge label={`${s.off_days} off`} variant="off" style={{ fontSize: 9 }} />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="secondary" onClick={() => navigate('/roster')} style={{ marginTop: 14 }}>
              View Full Roster →
            </Button>
          </Card>
        )}

        {/* Quick Actions */}
        {!activeRoster && (
          <Card accent style={{ gridColumn: '1 / -1' }}>
            <CardHeader icon="🚀" title="Quick Start" />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button onClick={() => navigate('/officers')}>👮 Add Officers</Button>
              <Button variant="secondary" onClick={() => navigate('/duties')}>📋 Configure Duties</Button>
              <Button variant="secondary" onClick={() => navigate('/config')}>⚙ Station Setup</Button>
              <Button variant="success" onClick={() => navigate('/generate')}>🤖 Generate First Roster</Button>
            </div>
          </Card>
        )}
      </Grid>
    </div>
  );
}