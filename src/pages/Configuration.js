import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { PageHeader, Card, CardHeader, Grid, Field, Input, Select, Button, Alert } from '../components/UI';

export default function Configuration() {
  const { config, setConfig } = useApp();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) setForm({ ...config });
  }, [config]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.updateConfig(form);
      setConfig(res.data.data);
      toast.success('Configuration saved');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { toast.error('Failed to save config'); }
    setLoading(false);
  };

  if (!form) return <div style={{ color: 'var(--text2)', padding: 24 }}>Loading configuration...</div>;

  return (
    <div className="fade-in">
      <PageHeader title="Station Configuration" subtitle="Configure scheduling rules and equity parameters" />

      {saved && <Alert type="success">✓ Configuration saved successfully</Alert>}

      <Grid cols={2} gap={16}>
        <Card accent>
          <CardHeader icon="🏛" title="Station Details" />
          <Field label="Station Name">
            <Input value={form.stationName || ''} onChange={e => set('stationName', e.target.value)} />
          </Field>
          <Field label="Roster Period (days)">
            <Select value={form.rosterPeriod || 14} onChange={e => set('rosterPeriod', parseInt(e.target.value))}>
              <option value={7}>7 Days — Weekly</option>
              <option value={14}>14 Days — Bi-weekly</option>
              <option value={30}>30 Days — Monthly</option>
            </Select>
          </Field>
          <Field label="Roster Start Date">
            <Input type="date" value={form.startDate || ''} onChange={e => set('startDate', e.target.value)} />
          </Field>
          <Field label="Min Officers Per Shift">
            <Input type="number" value={form.minOfficersPerShift || 3} onChange={e => set('minOfficersPerShift', parseInt(e.target.value))} min={1} max={20} />
          </Field>
        </Card>

        <Card accent>
          <CardHeader icon="⚖" title="Equity & Fairness Rules" />
          <Field label={`Night Shift Weight: ${form.nightShiftWeight || 2}x`}>
            <input type="range" min={1} max={5} value={form.nightShiftWeight || 2}
              onChange={e => set('nightShiftWeight', parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--cyan)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
              <span>1x (no weight)</span><span>5x (heavy penalty)</span>
            </div>
          </Field>
          <Field label={`Weekend Premium: ${form.weekendWeight || 1}x`}>
            <input type="range" min={1} max={5} value={form.weekendWeight || 1}
              onChange={e => set('weekendWeight', parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--gold)' }} />
          </Field>
          <Field label="Max Consecutive Shifts">
            <Input type="number" value={form.maxConsecutiveShifts || 5} onChange={e => set('maxConsecutiveShifts', parseInt(e.target.value))} min={1} max={7} />
          </Field>
          <Field label="Min Rest Hours Between Shifts">
            <Input type="number" value={form.restHoursBetweenShifts || 12} onChange={e => set('restHoursBetweenShifts', parseInt(e.target.value))} min={8} max={24} />
          </Field>
          <Field label="Priority Mode">
            <Select value={form.priorityMode || 'balanced'} onChange={e => set('priorityMode', e.target.value)}>
              <option value="balanced">Balanced Distribution</option>
              <option value="seniority">Seniority Based</option>
              <option value="rotation">Pure Rotation</option>
            </Select>
          </Field>
        </Card>
      </Grid>

      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        <Button onClick={handleSave} disabled={loading} style={{ padding: '11px 28px' }}>
          {loading ? '...' : '✓ Save Configuration'}
        </Button>
        <Button variant="ghost" onClick={() => setForm({ ...config })}>Reset Changes</Button>
      </div>
    </div>
  );
}