"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { api } from "@/lib/api";

type Row = { id: number; name: string; email: string; role: string; station_scope?: string; is_active: boolean };
type Officer = { id: number; name: string; belt_number: string; rank: string; station: string };

const ROLES = ["Admin", "DSP", "CI", "SI", "Viewer"];

export default function UserManagementPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("ChangeMe123!");
  const [role, setRole] = useState("Viewer");
  const [stationScope, setStationScope] = useState("");
  const [creating, setCreating] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const loadUsers = () => api.users().then(setRows).catch(console.error);

  useEffect(() => { loadUsers(); }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    setSelectedOfficer(null);
    clearTimeout(searchTimer.current);
    if (!val.trim()) { setOfficers([]); return; }
    searchTimer.current = setTimeout(() => {
      api.officers(val).then(setOfficers).catch(console.error);
    }, 300);
  };

  const pickOfficer = (o: Officer) => {
    setSelectedOfficer(o);
    setSearch(o.name);
    setOfficers([]);
  };

  const handleCreate = async () => {
    if (!selectedOfficer || !email) return;
    setCreating(true);
    try {
      await api.createUser({
        name: selectedOfficer.name,
        email,
        password: password || "ChangeMe123!",
        role,
        station_scope: stationScope || undefined,
      });
      setShowModal(false);
      resetForm();
      loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create user";
      alert(msg);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setSearch("");
    setOfficers([]);
    setSelectedOfficer(null);
    setEmail("");
    setPassword("ChangeMe123!");
    setRole("Viewer");
    setStationScope("");
  };

  const columns = useMemo<ColumnDef<Row>[]>(() => [
    { accessorKey: "name",          header: "Name" },
    { accessorKey: "email",         header: "Email" },
    { accessorKey: "role",          header: "Role" },
    { accessorKey: "station_scope", header: "Scope" },
    { id: "active", header: "Active", cell: ({ row }) => row.original.is_active ? "Yes" : "No" },
  ], []);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Role Model</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-5">
          {["Admin: full access", "DSP: district-level", "CI: station/group-level", "SI: local station", "Viewer: read-only"].map((item) => (
            <div key={item} className="rounded-md bg-muted p-3">{item}</div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-stone-600">All Users</h3>
        <Button onClick={() => setShowModal(true)} size="sm">
          + Create User
        </Button>
      </div>

      <DataTable data={rows} columns={columns} searchPlaceholder="Search users and roles" />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl border border-orange-100 bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-stone-800">Create User Login</h3>

            <div className="relative">
              <label className="mb-1 block text-xs font-medium text-stone-500">Search Officer</label>
              <Input
                placeholder="Type name or belt number..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {officers.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-lg">
                  {officers.map((o) => (
                    <li
                      key={o.id}
                      onClick={() => pickOfficer(o)}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-orange-50 text-stone-700"
                    >
                      {o.name} <span className="text-stone-400">({o.belt_number} — {o.rank})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selectedOfficer && (
              <div className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-stone-700">
                Selected: <strong>{selectedOfficer.name}</strong> ({selectedOfficer.belt_number}, {selectedOfficer.rank})
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">Email *</label>
                <Input placeholder="email@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">Role</label>
                <Select value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">Station Scope</label>
                <Input placeholder="e.g. North, Central" value={stationScope} onChange={(e) => setStationScope(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating || !selectedOfficer || !email}>
                {creating ? "Creating..." : "Create User"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
