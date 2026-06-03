"use client";
import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { downloadUrl } from "@/lib/api";

export default function ReportsPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const suffix = date ? `?date=${date}` : "";
  return (
    <Card>
      <CardHeader><CardTitle>Roster Exports</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Input className="max-w-52" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <a href={downloadUrl(`/api/reports/roster.xlsx${suffix}`)}><Button type="button" variant="secondary"><Download className="h-4 w-4" /> Daily Excel</Button></a>
        <a href={downloadUrl("/api/reports/roster.xlsx")}><Button type="button" variant="secondary"><Download className="h-4 w-4" /> All Excel</Button></a>
        <a href={downloadUrl(`/api/reports/roster.pdf${suffix}`)}><Button type="button"><Download className="h-4 w-4" /> Daily PDF</Button></a>
      </CardContent>
    </Card>
  );
}
