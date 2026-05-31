import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { PageHeader, Card, CardHeader, Grid, Field, Input, Select, Button, Badge, EmptyState } from '../components/UI';

const COLORS = ['morning', 'evening', 'night', 'off', 'info'];
const COLOR_LABELS = { morning: 'Morning (Amber)', evening: 'Evening (Purple)', night: 'Night (Cyan)', off: 'Off-duty (Gray)', info: 'Special (Blue)' };

const emptyForm = { code: '', name: '', startTime: '06:00', endTime: '14:00', priority: '2', color: 'morning', requiredRank: '' };

export default function DutyTypes() {
  const { dutyTypes, refreshDuties } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [editCode, setEditCode] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.name.trim()) return toast.error('Code and Name are required');
    setLoading(true);
    try {
      if (editCode) {
        await api.updateDuty(editCode, form);
        toast.success('Duty type updated');
        setEditCode(null);
      } else {
        await api.createDuty(form);
        toast.success('Duty type added');
      }
      setForm(emptyForm);
      refreshDuties();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save duty type');
    }
    setLoading(false);
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`Remove duty type ${code}?`)) return;
    try { await api.deleteDuty(code); toast.success('Duty type removed'); refreshDuties(); }
    catch { toast.error('Failed to remove'); }
  };

  const handleEdit = (d) => {
    setForm({ ...d, priority: String(d.priority) });
    setEditCode(d.code);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fade-in">
      <PageHeader title="Duty Configuration" subtitle="Define custom shift types and scheduling rules" />

      <Grid cols={2} gap={16}>
        <Card accent>
          <CardHeader icon="➕" title={editCode ? `Editing ${editCode}` : 'New Duty Type'} />
          <Grid cols={2} gap={10}>
            <Field label="Duty Code">
              <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="MORNING" disabled={!!editCode} />
            </Field>
            <Field label="Priority (1-4)">
              <Select value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="1">1 — Standard</option>
                <option value="2">2 — Moderate</option>
                <option value="3">3 — High</option>
                <option value="4">4 — Critical</option>
              </Select>
            </Field>
          </Grid>
          <Field label="Duty Name">
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Morning Patrol Shift" />
          </Field>
          <Grid cols={2} gap={10}>
            <Field label="Start Time">
              <Input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
            </Field>
            <Field label="End Time">
              <Input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
            </Field>
          </Grid>
          <Grid cols={2} gap={10}>
            <Field label="Color Theme">
              <Select value={form.color} onChange={e => set('color', e.target.value)}>
                {COLORS.map(c => <option key={c} value={c}>{COLOR_LABELS[c]}</option>)}
              </Select>
            </Field>
            <Field label="Min Rank (optional)">
              <Select value={form.requiredRank} onChange={e => set('requiredRank', e.target.value)}>
                <option value="">Any rank</option>
                <option value="Head Constable">Head Constable+</option>
                <option value="Sub-Inspector">Sub-Inspector+</option>
                <option value="Inspector">Inspector+</option>
              </Select>
            </Field>
          </Grid>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button onClick={handleSubmit} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? '...' : editCode ? '✓ Update' : '+ Add Duty Type'}
            </Button>
            {editCode && (
              <Button variant="ghost" onClick={() => { setForm(emptyForm); setEditCode(null); }}>Cancel</Button>
            )}
          </div>
        </Card>

        <Card accent>
          <CardHeader icon="📋" title="Active Duty Types" count={dutyTypes.length} />
          <div style={{ maxHeight: 440, overflowY: 'auto' }}>
            {dutyTypes.length === 0 ? (
              <EmptyState icon="📝" title="No duty types defined" subtitle="Create your first duty type using the form" />
            ) : dutyTypes.map(d => (
              <div key={d.code} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 3, marginBottom: 8,
              }}>
                <Badge label={d.code} variant={d.color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                    {d.startTime ? `${d.startTime} – ${d.endTime}` : 'No fixed time'} · Priority {d.priority}
                    {d.requiredRank && ` · Min: ${d.requiredRank}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <Button variant="ghost" onClick={() => handleEdit(d)} style={{ padding: '4px 8px', fontSize: 11 }}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDelete(d.code)} style={{ padding: '4px 8px', fontSize: 11 }}>✕</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Grid>
    </div>
  );
}