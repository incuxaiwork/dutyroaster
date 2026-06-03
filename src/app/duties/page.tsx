"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckSquare, Eye, Loader2, Pencil, Plus, Shuffle, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Assignment, Duty, Officer } from "@/types/domain";

const today = new Date().toISOString().slice(0, 10);
const DUTY_TYPES = ["Collector Banglow Guard", "Police Guest House Guard for DIG ATP", "S.P Camp Office Guard and Night Guard",
  "Armoury Guard (Bugler HC-01)", "DPO Main Gate Guard", "Treasury Guard Collectorate at ATP",
  "EVM Guard-1 at RDO Office, ATP", "EVM's Strong Room Guard at Mechanical Building JNTU, ATP",
  "Ballot Paper (MLC) Guard at JNTU, ATP", "PTC Guard at ATP"];

const empty = { duty_name: "", duty_type: DUTY_TYPES[0], location: "", start_date: today, end_date: "", start_time: "08:00", end_time: "14:00", shift_type: "Morning", required_officers: 1, required_rank: "", required_skills: "", priority_level: "Medium", special_instructions: "", status: "Pending Allocation", incharge_officer_id: "" as string | number };

const STATUS_BADGE: Record<string, string> = { "Draft": "bg-gray-100 text-gray-600", "Pending Allocation": "bg-amber-100 text-amber-700", "Allocated": "bg-blue-100 text-blue-700", "In Progress": "bg-violet-100 text-violet-700", "Completed": "bg-green-100 text-green-700", "Cancelled": "bg-red-100 text-red-600" };

export default function DutiesPage() {
  const [duties, setDuties] = useState<Duty[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [allocDate, setAllocDate] = useState(today);
  const [allocating, setAllocating] = useState(false);
  const [allocResult, setAllocResult] = useState<{ batch_id: number; assigned_count: number; fairness_score: number; assignments: Assignment[]; unfilled: unknown[] } | null>(null);
  const [officerSearch, setOfficerSearch] = useState("");
  const [officerOpen, setOfficerOpen] = useState(false);
  const officerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const f = (e: MouseEvent) => { if (officerRef.current && !officerRef.current.contains(e.target as Node)) setOfficerOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);

  const filteredOfficers = officers.filter((o) => `${o.name} ${o.rank} ${o.belt_number}`.toLowerCase().includes(officerSearch.toLowerCase()));
  const rankOptions = useMemo(() => [...new Set(officers.map((o) => o.rank).filter(Boolean))].sort(), [officers]);

  const load = () => api.duties().then((d) => setDuties(d.filter((d) => d.status !== "Cancelled"))).catch(console.error);
  useEffect(() => { void load(); api.officers().then(setOfficers).catch(console.error); }, []);

  const allSelected = duties.length > 0 && selectedIds.size === duties.length;
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(duties.map((d) => d.id)));
  const toggleOne = (id: number) => setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  function openCreate() { setForm(empty); setEditingId(null); setShowForm(true); setError(""); window.scrollTo(0, 0); }
  function openEdit(d: Duty) { setForm({ ...empty, ...d, start_time: (d.start_time ?? "08:00:00").slice(0, 5), end_time: (d.end_time ?? "14:00:00").slice(0, 5), required_skills: Array.isArray(d.required_skills) ? d.required_skills.join(", ") : String(d.required_skills ?? ""), incharge_officer_id: (d.incharge_officer_id ?? "") as string | number, end_date: d.end_date ?? "" }); setEditingId(d.id); setShowForm(true); setError(""); window.scrollTo(0, 0); }

  async function submit(e: FormEvent) {
    e.preventDefault(); setError("");
    const payload = { ...form, shift_type: form.shift_type as Duty["shift_type"], required_officers: Number(form.required_officers), required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean), incharge_officer_id: form.incharge_officer_id !== "" ? Number(form.incharge_officer_id) : null };
    try {
      if (editingId !== null) await api.updateDuty(editingId, payload as Partial<Duty>);
      else await api.createDuty(payload as Partial<Duty>);
      closeForm(); load();
    } catch (err) { setError(String(err)); }
  }
  function closeForm() { setShowForm(false); setEditingId(null); setError(""); }

  async function changeStatus(id: number, status: string) { try { await api.updateDutyStatus(id, status); load(); } catch (err) { setError(String(err)); } }
  function deleteDuty(id: number) { setDuties((prev) => prev.filter((d) => d.id !== id)); setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; }); api.deleteDuty(id).catch((e) => { setError(String(e)); load(); }); }

  async function generateRoster() {
    setAllocating(true); setAllocResult(null); setError("");
    try { const result = await api.generateRoster({ date: allocDate, duty_ids: [...selectedIds] }); setAllocResult(result); setSelectedIds(new Set()); load(); }
    catch (err) { console.error(err); setError("Could not reach the API."); }
    finally { setAllocating(false); }
  }

  const columns = useMemo<ColumnDef<Duty>[]>(() => [
    { id: "select", header: () => <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-orange-500 cursor-pointer" />, cell: ({ row }) => <input type="checkbox" checked={selectedIds.has(row.original.id)} onChange={() => toggleOne(row.original.id)} className="h-4 w-4 accent-orange-500 cursor-pointer" /> },
    { accessorKey: "duty_name", header: "Duty Name" },
    { accessorKey: "duty_type", header: "Type" },
    { accessorKey: "location", header: "Location" },
    { accessorKey: "start_date", header: "Start Date" },
    { accessorKey: "shift_type", header: "Shift" },
    { accessorKey: "required_officers", header: "Officers" },
    { id: "incharge", header: "In-charge", cell: ({ row }) => row.original.incharge_officer_name ? <span className="font-medium text-orange-700">{row.original.incharge_officer_name} <span className="text-stone-400 font-normal">{row.original.incharge_officer_rank} ({row.original.incharge_officer_belt})</span></span> : <span className="text-stone-300">—</span> },
    { id: "priority", header: "Priority", cell: ({ row }) => <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[row.original.priority_level] ?? ""}`}>{row.original.priority_level}</span> },
    { id: "edit", header: "", cell: ({ row }) => <Button size="sm" variant="ghost" title="Edit" onClick={() => openEdit(row.original)}><Pencil className="h-4 w-4 text-stone-400 hover:text-orange-500" /></Button> },
    { id: "status", header: "Status", cell: ({ row }) => {
      const s = row.original.status;
      if (s === "Cancelled") return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600"><X className="h-3 w-3" /> Cancelled</span>;
      const isCompleted = s === "Completed"; const isOngoing = s === "Pending Allocation" || s === "Allocated" || s === "In Progress";
      return <div className="flex items-center gap-2">
        <button type="button" onClick={() => changeStatus(row.original.id, isCompleted ? "In Progress" : "Completed")}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${isCompleted ? "bg-green-500" : isOngoing ? "bg-violet-400" : "bg-stone-300"} cursor-pointer`}>
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${isCompleted ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
        </button>
        <span className={`text-xs font-medium cursor-pointer hover:underline ${isCompleted ? "text-green-600" : isOngoing ? "text-violet-600" : "text-stone-400"}`} onClick={() => changeStatus(row.original.id, isCompleted ? "In Progress" : "Completed")}>{isCompleted ? "Completed" : isOngoing ? "Ongoing" : s}</span>
      </div>;
    }},
  ], [duties, selectedIds, allSelected]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">{duties.length} {duties.length === 1 ? "duty" : "duties"}</p>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Create Duty</Button>
      </div>
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <CheckSquare className="h-5 w-5 text-orange-600 shrink-0" />
          <span className="text-sm font-semibold text-orange-800">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <span className="text-xs text-stone-500">Date:</span>
            <Input type="date" value={allocDate} onChange={(e) => setAllocDate(e.target.value)} className="w-40 h-8 text-sm" />
            <Button size="sm" onClick={generateRoster} disabled={allocating}>
              {allocating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Shuffle className="h-4 w-4" /> Generate</>}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}><X className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
      {allocResult && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-700 text-base">✅ Roster generated — {allocResult.assigned_count} assigned · Fairness: {allocResult.fairness_score}</CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="primary" onClick={() => { setActivePage("daily"); }}><Eye className="h-4 w-4" /> View Daily Roster</Button>
                <button onClick={() => setAllocResult(null)} className="text-stone-400 hover:text-stone-600"><X className="h-4 w-4" /></button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {allocResult.unfilled.length > 0 && <p className="mb-3 text-sm text-red-600 font-medium">⚠ {allocResult.unfilled.length} duty/duties could not be fully staffed.</p>}
            <div className="overflow-x-auto rounded-lg border border-green-200">
              <table className="w-full text-sm">
                <thead className="bg-green-50">
                  <tr>{["Duty", "Location", "Officer", "Belt No.", "Shift", "Hours"].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-green-700">{h}</th>)}</tr>
                </thead>
                <tbody>{allocResult.assignments.map((a) => (
                  <tr key={a.id} className="border-t border-green-100 hover:bg-green-50/60">
                    <td className="px-3 py-2 font-medium">{a.duty_name}</td>
                    <td className="px-3 py-2 text-stone-500">{a.location}</td>
                    <td className="px-3 py-2">{a.officer_name}</td>
                    <td className="px-3 py-2 text-stone-400 text-xs">{a.belt_number}</td>
                    <td className="px-3 py-2">{a.shift_type}</td>
                    <td className="px-3 py-2 font-semibold text-orange-700">{a.working_hours}h</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingId !== null ? "Edit Duty" : "Create Duty"}</CardTitle>
              <button onClick={closeForm} className="text-stone-400 hover:text-stone-600"><X className="h-4 w-4" /></button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-1"><label className="text-xs font-medium text-stone-500">Duty Name *</label><Input required placeholder="e.g. Market Patrol" value={form.duty_name} onChange={(e) => setForm({ ...form, duty_name: e.target.value })} /></div>
              <div className="flex flex-col gap-1"><label className="text-xs font-medium text-stone-500">Type</label><Select value={form.duty_type} onChange={(e) => setForm({ ...form, duty_type: e.target.value })}>{DUTY_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></div>
              <div className="flex flex-col gap-1"><label className="text-xs font-medium text-stone-500">Location</label><Input placeholder="e.g. Central Market" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div className="flex flex-col gap-1"><label className="text-xs font-medium text-stone-500">Start Date</label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div className="flex flex-col gap-1"><label className="text-xs font-medium text-stone-500">End Date</label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              <div className="flex flex-col gap-1"><label className="text-xs font-medium text-stone-500">Start Time</label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
              <div className="flex flex-col gap-1"><label className="text-xs font-medium text-stone-500">End Time</label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
              <div className="flex flex-col gap-1"><label className="text-xs font-medium text-stone-500">Shift</label><Select value={form.shift_type} onChange={(e) => setForm({ ...form, shift_type: e.target.value })}><option>Morning</option><option>Evening</option><option>Night</option><option>Custom</option></Select></div>
              <div className="flex flex-col gap-1"><label className="text-xs font-medium text-stone-500">Officers Required</label><Input type="number" min={1} value={form.required_officers} onChange={(e) => setForm({ ...form, required_officers: Number(e.target.value) })} /></div>
              <div className="flex flex-col gap-1"><label className="text-xs font-medium text-stone-500">Required Rank</label><Select value={form.required_rank} onChange={(e) => setForm({ ...form, required_rank: e.target.value })}><option value="">Any rank</option>{rankOptions.map((r) => <option key={r}>{r}</option>)}</Select></div>
              <div className="flex flex-col gap-1" ref={officerRef}>
                <label className="text-xs font-medium text-stone-500">In-charge Officer</label>
                <div className="relative">
                  <div className="flex h-10 w-full items-center justify-between rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm cursor-pointer" onClick={() => { setOfficerOpen(!officerOpen); if (!officerOpen) setOfficerSearch(""); }}>
                    <span className={form.incharge_officer_id ? "" : "text-stone-400"}>{form.incharge_officer_id ? (officers.find((o) => o.id === Number(form.incharge_officer_id)) ? `${officers.find((o) => o.id === Number(form.incharge_officer_id))!.name} — ${officers.find((o) => o.id === Number(form.incharge_officer_id))!.rank}` : "Select…") : "Select…"}</span>
                    <svg className={`h-4 w-4 text-stone-400 transition-transform ${officerOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {officerOpen && (
                    <div className="absolute z-10 top-full mt-1 left-0 right-0 rounded-lg border border-stone-200 bg-white shadow-lg">
                      <input autoFocus placeholder="Search officer…" className="w-full border-b border-stone-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-200" value={officerSearch} onChange={(e) => setOfficerSearch(e.target.value)} />
                      <div className="max-h-48 overflow-y-auto">
                        {filteredOfficers.slice(0, 100).map((o) => (
                          <button key={o.id} type="button" className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 ${String(form.incharge_officer_id) === String(o.id) ? "bg-orange-50 font-medium text-orange-700" : ""}`} onClick={() => { setForm({ ...form, incharge_officer_id: o.id }); setOfficerOpen(false); setOfficerSearch(""); }}>
                            {o.name} <span className="text-stone-400">— {o.rank} ({o.belt_number})</span>
                          </button>
                        ))}
                        {filteredOfficers.length === 0 && <div className="px-3 py-3 text-sm text-stone-400 text-center">No officers found</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1"><label className="text-xs font-medium text-stone-500">Priority</label><Select value={form.priority_level} onChange={(e) => setForm({ ...form, priority_level: e.target.value })}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></Select></div>
              <div className="flex flex-col gap-1"><label className="text-xs font-medium text-stone-500">Instructions</label><Textarea placeholder="Any special instructions…" value={form.special_instructions} onChange={(e) => setForm({ ...form, special_instructions: e.target.value })} /></div>
              <div className="md:col-span-2 lg:col-span-3 flex gap-3"><Button type="submit" className="flex-1">{editingId !== null ? "Update Duty" : "Create Duty"}</Button><Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}
      <DataTable data={duties} columns={columns} searchPlaceholder="Search duties, locations, shifts…" />
    </div>
  );
}

let setActivePage: (page: string) => void = () => {};
if (typeof window !== "undefined") {
  const orig = setActivePage;
  setActivePage = (page: string) => { window.location.hash = `/${page}`; };
}
