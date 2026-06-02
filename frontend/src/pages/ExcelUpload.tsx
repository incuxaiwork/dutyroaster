import { CheckCircle, Download, Loader2, ListChecks, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { api, downloadUrl } from "../lib/api";

const STEPS = [
  { n: 1, label: "Download Template",  desc: "Get the Excel file with the correct column format." },
  { n: 2, label: "Fill Your Officers", desc: "Add all your officers' details in the rows below the sample rows. Keep the column headers exactly as they are." },
  { n: 3, label: "Upload the File",    desc: "Click 'Upload Excel' and select your filled file. All officers will be imported at once." },
];

const COLUMNS = [
  { col: "Name",                       required: true,  eg: "Asha Rao" },
  { col: "Belt Number / Employee ID",  required: true,  eg: "PC-1001" },
  { col: "Rank",                       required: true,  eg: "Constable / Head Constable / SI / CI / DSP" },
  { col: "Station",                    required: true,  eg: "Central" },
  { col: "Mobile Number",              required: false, eg: "9999999999" },
  { col: "Gender",                     required: false, eg: "Male / Female" },
  { col: "Department/Unit",            required: false, eg: "Traffic" },
  { col: "Joining Date",               required: false, eg: "2022-01-15 (YYYY-MM-DD)" },
  { col: "Availability Status",        required: false, eg: "Available / On Leave / Training / Suspended" },
  { col: "Skills",                     required: false, eg: "Traffic Control, First Aid  (comma separated)" },
];

export function ExcelUpload() {
  const [imported, setImported] = useState<number | null>(null);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    setImported(null);
    setError("");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await api.uploadOfficers(form);
      setImported(result.imported);
    } catch (err) {
      setError(`Upload failed: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Steps */}
      <Card>
        <CardHeader><CardTitle>How to Import Officers</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {STEPS.map(({ n, label, desc }) => (
              <li key={n} className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-100 text-orange-700 text-sm font-bold flex items-center justify-center">{n}</span>
                <div>
                  <div className="font-medium text-stone-800 text-sm">{label}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Column reference */}
      {/* <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-orange-500" />
            <CardTitle>Column Reference</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-orange-50 border-b border-orange-100">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-orange-700">Column Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-orange-700">Required</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-orange-700">Example / Allowed Values</th>
              </tr>
            </thead>
            <tbody>
              {COLUMNS.map((c, i) => (
                <tr key={c.col} className={`border-t border-orange-50 ${i % 2 === 0 ? "bg-white" : "bg-orange-50/20"}`}>
                  <td className="px-4 py-2 font-mono text-xs font-medium text-stone-700">{c.col}</td>
                  <td className="px-4 py-2">
                    {c.required
                      ? <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Required</span>
                      : <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-stone-400">Optional</span>}
                  </td>
                  <td className="px-4 py-2 text-xs text-stone-500">{c.eg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card> */}

      {/* Actions */}
      <Card>
        <CardHeader><CardTitle>Upload File</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <a href={downloadUrl("/api/officers/template")}>
              <Button type="button" variant="secondary">
                <Download className="h-4 w-4" /> Download Template (5 sample rows)
              </Button>
            </a>
            <label className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-colors ${loading ? "bg-orange-400 pointer-events-none" : "bg-orange-600 hover:bg-orange-700"}`}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {loading ? "Importing..." : "Upload Excel"}
              <input className="hidden" type="file" accept=".xlsx,.xls,.csv" disabled={loading} onChange={(e) => upload(e.target.files?.[0])} />
            </label>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {imported !== null && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 space-y-3">
              <div className="flex items-center gap-2 text-green-700 font-medium">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Upload successful — {imported} officer{imported !== 1 ? "s" : ""} imported.
              </div>
              <Button variant="primary" onClick={() => { window.location.hash = "/officers"; }}>
                <ListChecks className="h-4 w-4" /> View Officers
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
