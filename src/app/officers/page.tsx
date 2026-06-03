"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { AvailabilityStatus, Officer } from "@/types/domain";

const RANKS = ["Constable", "Head Constable", "SI", "CI", "DSP"];
const AVAILABILITY: AvailabilityStatus[] = ["Available", "On Leave", "Training", "Suspended", "Special Assignment"];
const empty = { name: "", belt_number: "", rank: "Constable", station: "", mobile_number: "", gender: "", department_unit: "", joining_date: "", availability_status: "Available" as AvailabilityStatus, skills: "" };

function statusBadge(status: string) {
  const map: Record<string, string> = {
    "Available": "bg-green-100 text-green-700", "On Leave": "bg-amber-100 text-amber-700",
    "Training": "bg-blue-100 text-blue-700", "Suspended": "bg-red-100 text-red-700",
    "Special Assignment": "bg-violet-100 text-violet-700",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

export default function OfficersPage() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = () => api.officers().then(setOfficers).catch(console.error);
  useEffect(() => { void load(); }, []);

  const columns = useMemo<ColumnDef<Officer>[]>(() => [
    { accessorKey: "belt_number", header: "Belt No." },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "rank", header: "Rank" },
    { accessorKey: "station", header: "Station" },
    { accessorKey: "mobile_number", header: "Mobile", cell: ({ row }) => row.original.mobile_number ?? "—" },
    { accessorKey: "department_unit", header: "Dept/Unit", cell: ({ row }) => row.original.department_unit ?? "—" },
    { accessorKey: "weekly_hours", header: "Weekly Hrs", cell: ({ row }) => <span className="font-medium tabular-nums text-stone-700">{row.original.weekly_hours.toFixed(1)}</span> },
    { accessorKey: "monthly_hours", header: "Monthly Hrs", cell: ({ row }) => <span className="font-medium tabular-nums text-stone-700">{row.original.monthly_hours.toFixed(1)}</span> },
    { accessorKey: "availability_status", header: "Status", cell: ({ row }) => statusBadge(row.original.availability_status) },
    { id: "actions", header: "", cell: ({ row }) => (
      <Button size="sm" variant="ghost" title="Deactivate" onClick={() => api.deleteOfficer(row.original.id).then(load).catch((e) => setError(String(e)))}>
        <Trash2 className="h-4 w-4 text-red-400" />
      </Button>
    )},
  ], []);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError("");
    try {
      await api.createOfficer({ ...form, skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean), joining_date: form.joining_date || undefined });
      setForm(empty); setShowForm(false); load();
    } catch (err) { setError(String(err)); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">{officers.length} officer{officers.length !== 1 ? "s" : ""} total</p>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "+ Add Officer"}</Button>
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add Officer</CardTitle></CardHeader>
          <CardContent>
            {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
            <form onSubmit={submit} className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[{ key: "name", label: "Name *", ph: "e.g. Asha Rao", req: true }, { key: "belt_number", label: "Belt No. *", ph: "e.g. PC-1001", req: true }].map((f) => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-stone-500">{f.label}</label>
                  <Input required={f.req} placeholder={f.ph} value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-500">Rank *</label>
                <Select value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })}>{RANKS.map((r) => <option key={r}>{r}</option>)}</Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-500">Station *</label>
                <Input required placeholder="e.g. Central" value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-500">Mobile</label>
                <Input placeholder="9999999999" value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-500">Gender</label>
                <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Select…</option><option>Male</option><option>Female</option><option>Other</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-500">Dept/Unit</label>
                <Input placeholder="e.g. Traffic" value={form.department_unit} onChange={(e) => setForm({ ...form, department_unit: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-500">Joining Date</label>
                <Input type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-500">Status</label>
                <Select value={form.availability_status} onChange={(e) => setForm({ ...form, availability_status: e.target.value as AvailabilityStatus })}>
                  {AVAILABILITY.map((a) => <option key={a}>{a}</option>)}
                </Select>
              </div>
              <div className="flex flex-col gap-1 lg:col-span-3">
                <label className="text-xs font-medium text-stone-500">Skills (comma separated)</label>
                <Input placeholder="e.g. Traffic Control, First Aid" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
              </div>
              <div className="lg:col-span-3"><Button type="submit" className="w-full">Add Officer</Button></div>
            </form>
          </CardContent>
        </Card>
      )}
      <DataTable data={officers} columns={columns} searchPlaceholder="Search by name, belt number, rank, station…" />
    </div>
  );
}
