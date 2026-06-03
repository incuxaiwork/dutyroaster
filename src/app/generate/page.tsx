"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { Shuffle } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Assignment } from "@/types/domain";

const today = new Date().toISOString().slice(0, 10);

export default function GenerateRosterPage() {
  const [date, setDate] = useState(today);
  const [station, setStation] = useState("");
  const [shift, setShift] = useState("");
  const [result, setResult] = useState<{ batch_id: number; fairness_score: number; assigned_count: number; unfilled: unknown[]; assignments: Assignment[] } | null>(null);

  const columns = useMemo<ColumnDef<Assignment>[]>(() => [
    { accessorKey: "duty_name", header: "Duty" },
    { accessorKey: "location", header: "Location" },
    { accessorKey: "officer_name", header: "Officer" },
    { accessorKey: "belt_number", header: "Belt" },
    { accessorKey: "shift_type", header: "Shift" },
    { accessorKey: "working_hours", header: "Hours" },
  ], []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = { date, station: station || undefined, shift: shift || undefined };
    try {
      setResult(await api.generateRoster(payload));
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Auto Allocate Officers</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-4">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input placeholder="Station optional" value={station} onChange={(e) => setStation(e.target.value)} />
            <Select value={shift} onChange={(e) => setShift(e.target.value)}>
              <option value="">All shifts</option><option>Morning</option><option>Evening</option><option>Night</option><option>Custom</option>
            </Select>
            <Button><Shuffle className="h-4 w-4" /> Generate</Button>
          </form>
        </CardContent>
      </Card>
      {result && (
        <>
          {result.batch_id === 999 && <div className="rounded-md border border-warning/30 bg-warning/10 px-4 py-2 text-sm text-slate-700">Showing demo roster because the API is not reachable.</div>}
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent><div className="text-sm text-slate-500">Batch</div><div className="text-2xl font-semibold">#{result.batch_id}</div></CardContent></Card>
            <Card><CardContent><div className="text-sm text-slate-500">Assigned</div><div className="text-2xl font-semibold">{result.assigned_count}</div></CardContent></Card>
            <Card><CardContent><div className="text-sm text-slate-500">Fairness</div><div className="text-2xl font-semibold">{result.fairness_score}</div></CardContent></Card>
          </div>
          <DataTable data={result.assignments} columns={columns} searchPlaceholder="Search generated assignments" />
        </>
      )}
    </div>
  );
}
