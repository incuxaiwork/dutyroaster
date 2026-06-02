import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "../components/DataTable";
import { api } from "../lib/api";

type Row = { id: number; action: string; entity_type: string; details?: string; created_at: string };

export function AuditLogs() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    api.audit()
      .then(setRows)
      .catch((err) => console.error("Failed to load audit logs:", err));
  }, []);

  const columns = useMemo<ColumnDef<Row>[]>(() => [
    { accessorKey: "action",      header: "Action" },
    { accessorKey: "entity_type", header: "Entity" },
    { accessorKey: "details",     header: "Details" },
    { accessorKey: "created_at",  header: "Timestamp" },
  ], []);

  return <DataTable data={rows} columns={columns} searchPlaceholder="Search audit logs" />;
}
