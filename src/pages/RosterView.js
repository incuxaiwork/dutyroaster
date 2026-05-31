import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { PageHeader, Card, CardHeader, Badge, Button, StatCard, Grid, EmptyState, ProgressBar, Alert } from '../components/UI';
import toast from 'react-hot-toast';

const CELL_STYLES = {
  morning: { background: 'rgba(245,158,11,0.14)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' },
  evening: { background: 'rgba(139,92,246,0.14)', color: '#a5b4fc', border: '1px solid rgba(139,92,246,0.25)' },
  night: { background: 'rgba(6,182,212,0.14)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.25)' },
  off: { background: 'rgba(100,116,139,0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' },
  info: { background: 'rgba(37,99,235,0.14)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.25)' },
};

function DutyCell({ code, dutyTypes }) {
  const dt = dutyTypes.find(d => d.code === code);
  const variant = dt?.color || 'off';
  const style = CELL_STYLES[variant] || CELL_STYLES.off;
  return (
    <span style={{
      ...style, padding: '3px 8px', borderRadius: 2,
      fontSize: 10, fontWeight: 700, display: 'inline-block', minWidth: 58, textAlign: 'center',
      fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 0.3,
    }}>
      {code || 'OFF'}
    </span>
  );
}

export default function RosterView() {
  const { rosters, activeRoster, setActiveRoster, dutyTypes, refreshRosters } = useApp();
  const navigate = useNavigate();
  const [view, setView] = useState('table'); // 'table' | 'stats'

  const roster = activeRoster;

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this roster?')) return;
    try {
      await api.deleteRoster(id);
      toast.success('Roster deleted');
      await refreshRosters();
    } catch { toast.error('Failed to delete'); }
  };

  const exportJSON = () => {
    if (!roster) return;
    const blob = new Blob([JSON.stringify(roster, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `roster_${roster.id?.slice(0, 8)}.json`;
    a.click();
  };

  // Get all unique officer IDs from roster
  const officerIds = roster
    ? [...new Set((roster.roster || []).flatMap(d => (d.assignments || []).map(a => a.officer_id)))]
    : [];

  const officerNames = {};
  if (roster) {
    (roster.roster || []).forEach(day => {
      (day.assignments || []).forEach(a => {
        officerNames[a.officer_id] = a.officer_name || a.officer_id;
      });
    });
  }

  const getAssignment = (day, officerId) => {
    const a = (day.assignments || []).find(x => x.officer_id === officerId);
    return a?.duty_code || 'OFF';
  };

  const maxShifts = roster
    ? Math.max(...(roster.officer_stats || []).map(s => s.total_shifts || 0), 1)
    : 1;

  return (
    <div className="fade-in">
      <PageHeader
        title="Duty Roster View"
        subtitle={roster ? `${roster.config?.stationName} · Generated ${new Date(roster.generatedAt).toLocaleDateString()}` : 'No roster generated'}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            {roster && (
              <>
                <Button variant="ghost" onClick={() => setView(v => v === 'table' ? 'stats' : 'table')}>
                  {view === 'table' ? '📊 Stats View' : '📅 Table View'}
                </Button>
                <Button variant="success" onClick={exportJSON}>⬇ Export</Button>
                <Button variant="danger" onClick={() => handleDelete(roster.id)}>🗑</Button>
              </>
            )}
            <Button onClick={() => navigate('/generate')}>🤖 New Roster</Button>
          </div>
        }
      />

      {/* Roster selector if multiple */}
      {rosters.length > 1 && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {rosters.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setActiveRoster(r)}
              style={{
                padding: '6px 14px', borderRadius: 3, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: r.id === roster?.id ? 'rgba(37,99,235,0.2)' : 'transparent',
                color: r.id === roster?.id ? 'var(--cyan)' : 'var(--text3)',
                border: r.id === roster?.id ? '1px solid rgba(6,182,212,0.3)' : '1px solid var(--border)',
                fontFamily: 'IBM Plex Mono, monospace',
              }}
            >
              Roster #{i + 1} · {new Date(r.generatedAt).toLocaleDateString()}
            </button>
          ))}
        </div>
      )}

      {!roster ? (
        <Card accent>
          <EmptyState
            icon="📅"
            title="No roster generated yet"
            subtitle="Use the AI Generate tab to create your first duty roster"
            action={<Button onClick={() => navigate('/generate')}>🤖 Generate Roster</Button>}
          />
        </Card>
      ) : (
        <>
          {/* Summary */}
          {roster.summary && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 3, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              📌 {roster.summary}
            </div>
          )}

          {roster.alerts?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {roster.alerts.map((a, i) => <Alert key={i} type="warning">⚠ {a}</Alert>)}
            </div>
          )}

          {view === 'stats' ? (
            /* STATS VIEW */
            <div>
              <Grid cols={4} gap={12} style={{ marginBottom: 20 }}>
                <StatCard label="Total Days" value={roster.roster?.length || 0} color="var(--cyan)" />
                <StatCard label="Officers" value={roster.officer_stats?.length || 0} color="var(--gold)" />
                <StatCard label="Total Assignments" value={(roster.officer_stats || []).reduce((a, s) => a + (s.total_shifts || 0), 0)} color="var(--green)" />
                <StatCard label="Night Shifts" value={(roster.officer_stats || []).reduce((a, s) => a + (s.night_shifts || 0), 0)} color="var(--purple)" />
              </Grid>

              <Card accent>
                <CardHeader icon="📊" title="Officer Workload Distribution" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                  {(roster.officer_stats || []).map(s => (
                    <div key={s.officer_id} style={{
                      background: 'rgba(26,37,64,0.6)', border: '1px solid var(--border)',
                      borderRadius: 3, padding: '12px 14px',
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{s.officer_name}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        <Badge label={`${s.total_shifts} shifts`} variant="info" />
                        <Badge label={`${s.night_shifts} nights`} variant="night" />
                        <Badge label={`${s.morning_shifts || 0} mornings`} variant="morning" />
                        <Badge label={`${s.off_days} off`} variant="off" />
                      </div>
                      <ProgressBar value={s.total_shifts} max={maxShifts} color="linear-gradient(90deg, var(--blue2), var(--cyan))" />
                      {s.equity_score && (
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 5 }}>
                          Equity: <span style={{ color: s.equity_score >= 80 ? 'var(--green)' : 'var(--gold)' }}>{s.equity_score}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            /* TABLE VIEW */
            <Card accent>
              <CardHeader icon="📅" title={`${roster.config?.rosterPeriod || 14}-Day Schedule`} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {dutyTypes.map(d => (
                  <Badge key={d.code} label={`${d.code}: ${d.name}`} variant={d.color} />
                ))}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: officerIds.length * 70 + 120 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text3)', fontWeight: 600, background: 'rgba(37,99,235,0.08)', borderBottom: '1px solid var(--border)', minWidth: 80 }}>Day</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text3)', fontWeight: 600, background: 'rgba(37,99,235,0.08)', borderBottom: '1px solid var(--border)', minWidth: 100 }}>Date</th>
                      {officerIds.map(id => (
                        <th key={id} style={{ padding: '8px 6px', textAlign: 'center', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)', fontWeight: 600, background: 'rgba(37,99,235,0.08)', borderBottom: '1px solid var(--border)', minWidth: 70 }}>
                          {(officerNames[id] || id).split(' ').slice(-1)[0]}
                          <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--text3)', fontSize: 9, fontWeight: 400 }}>{id}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(roster.roster || []).map(day => {
                      const date = new Date(day.date);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      return (
                        <tr key={day.day} style={{ background: isWeekend ? 'rgba(245,158,11,0.02)' : 'transparent' }}>
                          <td style={{ padding: '7px 10px', borderBottom: '1px solid rgba(99,179,237,0.05)', fontFamily: 'IBM Plex Mono, monospace', color: 'var(--cyan)', fontSize: 11 }}>
                            D{day.day}
                          </td>
                          <td style={{ padding: '7px 10px', borderBottom: '1px solid rgba(99,179,237,0.05)' }}>
                            <div style={{ fontSize: 11, color: isWeekend ? 'var(--gold)' : 'var(--text2)', fontWeight: isWeekend ? 600 : 400 }}>{day.date}</div>
                            <div style={{ fontSize: 9, color: 'var(--text3)' }}>{day.dayName}</div>
                          </td>
                          {officerIds.map(id => (
                            <td key={id} style={{ padding: '7px 6px', borderBottom: '1px solid rgba(99,179,237,0.05)', textAlign: 'center' }}>
                              <DutyCell code={getAssignment(day, id)} dutyTypes={dutyTypes} />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}