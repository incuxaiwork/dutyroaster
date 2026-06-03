"use client";
import { CheckCircle, Download, Loader2, ListChecks, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

const STEPS = [
  { n: 1, label: "Download Template", desc: "Get the Excel file with the correct column format." },
  { n: 2, label: "Fill Your Officers", desc: "Add all your officers' details below the sample rows." },
  { n: 3, label: "Upload the File", desc: "Click 'Upload Excel' and select your filled file." },
];

export default function ExcelUploadPage() {
  const [imported, setImported] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    setImported(null); setError(""); setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await api.uploadOfficers(form);
      setImported(result.imported);
    } catch (err) { setError(`Upload failed: ${err}`); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <Card>
        <CardHeader><CardTitle>How to Import Officers</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {STEPS.map(({ n, label, desc }) => (
              <li key={n} className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-100 text-orange-700 text-sm font-bold flex items-center justify-center">{n}</span>
                <div><div className="font-medium text-stone-800 text-sm">{label}</div><div className="text-xs text-stone-500 mt-0.5">{desc}</div></div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Upload File</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <a href="/api/officers/template">
              <Button type="button" variant="secondary"><Download className="h-4 w-4" /> Download Template</Button>
            </a>
            <label className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-colors ${loading ? "bg-orange-400 pointer-events-none" : "bg-orange-600 hover:bg-orange-700"}`}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {loading ? "Importing..." : "Upload Excel"}
              <input className="hidden" type="file" accept=".xlsx,.xls,.csv" disabled={loading} onChange={(e) => upload(e.target.files?.[0])} />
            </label>
          </div>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {imported !== null && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 space-y-3">
              <div className="flex items-center gap-2 text-green-700 font-medium">
                <CheckCircle className="h-5 w-5 text-green-500" /> Upload successful — {imported} officer{imported !== 1 ? "s" : ""} imported.
              </div>
              <Button variant="primary" onClick={() => window.location.hash = "/officers"}><ListChecks className="h-4 w-4" /> View Officers</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
