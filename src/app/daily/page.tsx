"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Assignment } from "@/types/domain";

const today = new Date().toISOString().slice(0, 10);

export default function DailyRosterPage() {
  const [date, setDate] = useState(today);
  const [rows, setRows] = useState<Assignment[]>([]);

  const columns = useMemo<ColumnDef<Assignment>[]>(() => [
    { accessorKey: "assignment_date", header: "Date" },
    { accessorKey: "duty_name",       header: "Duty" },
    { accessorKey: "location",        header: "Location" },
    { accessorKey: "officer_name",    header: "Officer" },
    { accessorKey: "belt_number",     header: "Belt" },
    { accessorKey: "station",         header: "Station" },
    { accessorKey: "shift_type",      header: "Shift" },
    { accessorKey: "start_time",      header: "Start" },
    { accessorKey: "end_time",        header: "End" },
    { accessorKey: "working_hours",   header: "Hours" },
  ], []);

  const load = () =>
    api.dailyRoster(date)
      .then(setRows)
      .catch((err) => console.error("Failed to load daily roster:", err));

  useEffect(() => { void load(); }, []);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Daily Roster</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Input className="max-w-52" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Button onClick={load}><RefreshCw className="h-4 w-4" /> Load</Button>
        </CardContent>
      </Card>
      <DataTable data={rows} columns={columns} searchPlaceholder="Search daily roster" />
    </div>
  );
}
