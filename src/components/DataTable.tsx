"use client";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "./ui/input";

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
};

export function DataTable<T>({ data, columns, searchPlaceholder = "Search…" }: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input className="pl-9" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder={searchPlaceholder} />
      </div>
      <div className="table-scroll rounded-xl border border-orange-100 bg-white shadow-soft overflow-hidden">
        <table className="w-full min-w-[840px] border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="bg-orange-50 border-b border-orange-100">
                {group.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-orange-700">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center text-sm text-stone-400">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-stone-200" />
                    <span>No records found.</span>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-t border-orange-50 transition-colors hover:bg-orange-50/60 ${
                    i % 2 === 0 ? "bg-white" : "bg-orange-50/20"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle text-stone-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-4 py-2.5 border-t border-orange-100 bg-orange-50/40 text-xs text-stone-400 text-right">
          {table.getRowModel().rows.length} of {data.length} records
        </div>
      </div>
    </div>
  );
}
