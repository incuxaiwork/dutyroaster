import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { PageHeader, Card, CardHeader, Grid, Field, Input, Select, Button, Avatar, EmptyState, Badge } from '../components/UI';

const RANKS = ['Constable', 'Head Constable', 'Sub-Inspector', 'Inspector', 'DSP', 'SP'];
const SPECS = ['General Duty', 'Traffic', 'Investigation', 'Armed Reserve', 'Cyber Cell', 'VVIP Security'];

const emptyForm = { id: '', name: '', rank: 'Inspector', specialization: 'General Duty', unavailDates: '' };

export default function Officers() {
  const { officers, refreshOfficers } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.id.trim() || !form.name.trim()) return toast.error('Badge ID and Name are required');
    setLoading(true);
    try {
      const payload = {
        ...form,
        unavailDates: form.unavailDates ? form.unavailDates.split(',').map(d => d.trim()).filter(Boolean) : [],
      };
      if (editId) {
        await api.updateOfficer(editId, payload);
        toast.success('Officer updated');
        setEditId(null);
      } else {
        await api.createOfficer(payload);
        toast.success('Officer added');
      }
      setForm(emptyForm);
      refreshOfficers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save officer');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Remove officer ${id}?`)) return;
    try {
      await api.deleteOfficer(id);
      toast.success('Officer removed');
      refreshOfficers();
    } catch { toast.error('Failed to remove officer'); }
  };

  const handleEdit = (o) => {
    setForm({ ...o, unavailDates: (o.unavailDates || []).join(', ') });
    setEditId(o.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClear = async () => {
    if (!window.confirm('Clear ALL officers? This cannot be undone.')) return;
    try { await api.clearOfficers(); toast.success('All officers cleared'); refreshOfficers(); }
    catch { toast.error('Failed to clear'); }
  };

  const filtered = officers.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.rank.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <PageHeader
        title="Personnel Registry"
        subtitle={`${officers.length} officers enrolled`}
        action={officers.length > 0 && <Button variant="danger" onClick={handleClear}>Clear All</Button>}
      />

      <Grid cols={2} gap={16}>
        <Card accent>
          <CardHeader icon="➕" title={editId ? `Editing ${editId}` : 'Add Officer'} />
          <Field label="Badge / ID Number">
            <Input value={form.id} onChange={e => set('id', e.target.value)} placeholder="e.g. P-1042" disabled={!!editId} />
          </Field>
          <Field label="Full Name">
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Inspector R. Sharma" />
          </Field>
          <Grid cols={2} gap={10}>
            <Field label="Rank">
              <Select value={form.rank} onChange={e => set('rank', e.target.value)}>
                {RANKS.map(r => <option key={r}>{r}</option>)}
              </Select>
            </Field>
            <Field label="Specialization">
              <Select value={form.specialization} onChange={e => set('specialization', e.target.value)}>
                {SPECS.map(s => <option key={s}>{s}</option>)}
              </Select>
            </Field>
          </Grid>
          <Field label="Unavailable Dates (comma-separated, YYYY-MM-DD)">
            <Input value={form.unavailDates} onChange={e => set('unavailDates', e.target.value)} placeholder="2025-07-10, 2025-07-15" />
          </Field>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button onClick={handleSubmit} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? '...' : editId ? '✓ Update Officer' : '+ Add Officer'}
            </Button>
            {editId && (
              <Button variant="ghost" onClick={() => { setForm(emptyForm); setEditId(null); }}>Cancel</Button>
            )}
          </div>
        </Card>

        <Card accent>
          <CardHeader icon="👮" title="Officers" count={officers.length} />
          <Input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, ID, rank..."
            style={{ marginBottom: 12 }}
          />
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <EmptyState icon="👤" title="No officers found" subtitle={officers.length === 0 ? "Add your first officer using the form" : "Try a different search"} />
            ) : filtered.map(o => (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <Avatar name={o.name} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{o.name}</span>
                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'var(--cyan)' }}>[{o.id}]</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{o.rank} · {o.specialization}</div>
                  {o.unavailDates?.length > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--gold)', marginTop: 2 }}>⚠ Unavail: {o.unavailDates.join(', ')}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <Button variant="ghost" onClick={() => handleEdit(o)} style={{ padding: '4px 8px', fontSize: 11 }}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDelete(o.id)} style={{ padding: '4px 8px', fontSize: 11 }}>✕</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Grid>
    </div>
  );
}