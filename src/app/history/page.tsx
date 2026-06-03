"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { api } from "@/lib/api";

type Row = { id: number; date: string; station?: string; shift_type?: string; fairness_score: number; is_locked: boolean; created_at: string };

export default function RosterHistoryPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    api.history()
      .then(setRows)
      .catch((err) => console.error("Failed to load roster history:", err));
  }, []);

  const columns = useMemo<ColumnDef<Row>[]>(() => [
    { accessorKey: "id",            header: "Batch" },
    { accessorKey: "date",          header: "Date" },
    { accessorKey: "shift_type",    header: "Shift" },
    { accessorKey: "fairness_score",header: "Fairness" },
    { id: "locked", header: "Locked", cell: ({ row }) => row.original.is_locked ? "Yes" : "No" },
    { accessorKey: "created_at",    header: "Created" },
  ], []);

  return <DataTable data={rows} columns={columns} searchPlaceholder="Search roster history" />;
}
