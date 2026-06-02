import { useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, AlertTriangle, BarChart3, CalendarCheck,
  Shield, TrendingDown, TrendingUp, Users, Zap,
} from "lucide-react";
import { api } from "../lib/api";
import type { DashboardAnalytics } from "../types/domain";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const PIE_COLORS = ["#ea580c", "#fb923c", "#fed7aa", "#c2410c"];

const STAT_CARDS = [
  { key: "total_officers",           label: "Total Officers",   icon: Users,         color: "from-orange-500 to-orange-600", bg: "bg-orange-50",  text: "text-orange-600" },
  { key: "available_officers",       label: "Available",        icon: Shield,         color: "from-green-500 to-green-600",  bg: "bg-green-50",   text: "text-green-600" },
  { key: "officers_on_leave",        label: "On Leave",         icon: Activity,       color: "from-amber-500 to-amber-600",  bg: "bg-amber-50",   text: "text-amber-600" },
  { key: "total_duties_today",       label: "Duties Today",     icon: CalendarCheck,  color: "from-orange-400 to-orange-500",bg: "bg-orange-50",  text: "text-orange-500" },
  { key: "pending_duties",           label: "Pending",          icon: AlertTriangle,  color: "from-red-500 to-red-600",      bg: "bg-red-50",     text: "text-red-600" },
  { key: "allocated_duties",         label: "Allocated",        icon: Zap,            color: "from-orange-600 to-red-600",   bg: "bg-orange-50",  text: "text-orange-700" },
  { key: "completed_duties",         label: "Completed",        icon: TrendingUp,     color: "from-teal-500 to-teal-600",    bg: "bg-teal-50",    text: "text-teal-600" },
  { key: "fairness_score",           label: "Fairness Score",   icon: BarChart3,      color: "from-orange-500 to-amber-500", bg: "bg-amber-50",   text: "text-amber-600" },
  { key: "duty_coverage_percentage", label: "Coverage %",       icon: Activity,       color: "from-orange-600 to-orange-700",bg: "bg-orange-50",  text: "text-orange-700" },
];

export function Dashboard() {
  const [data, setData]   = useState<DashboardAnalytics | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.analytics().then(setData).catch((err) => {
      console.error("Failed to load analytics:", err);
      setFailed(true);
    });
  }, []);

  if (failed) return (
    <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
      Could not reach the API. Make sure the backend is running.
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center h-64 text-stone-400 gap-3">
      <div className="h-5 w-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      Loading analytics…
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, bg, text }) => (
          <Card key={key} className="overflow-hidden">
            <CardContent className="p-0">
              <div className={`h-1.5 w-full bg-gradient-to-r ${color}`} />
              <div className="p-4 flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-muted-fg mb-1">{label}</div>
                  <div className="text-2xl font-bold text-foreground">
                    {data.cards[key] ?? 0}
                    {(key === "fairness_score" || key === "duty_coverage_percentage") && (
                      <span className="text-sm font-normal text-muted-fg ml-1">%</span>
                    )}
                  </div>
                </div>
                <div className={`${bg} rounded-xl p-2.5`}>
                  <Icon className={`h-5 w-5 ${text}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main charts ─────────────────────────────────────── */}
      {/* <div className="grid gap-5 xl:grid-cols-2">
        <BarCard title="Weekly Working Hours"  data={data.weekly_hours}  xKey="name" yKey="hours" color="#ea580c" />
        <BarCard title="Monthly Working Hours" data={data.monthly_hours} xKey="name" yKey="hours" color="#fb923c" />
      </div> */}

      {/* ── Deployment charts ───────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-3">
        <BarCard title="Station Deployment" data={data.station_deployment} xKey="name" yKey="count" color="#c2410c" />
        <BarCard title="Rank Deployment"    data={data.rank_deployment}    xKey="name" yKey="count" color="#d97706" />

        {/* Pie chart */}
        <Card>
          <CardHeader><CardTitle>Shift-wise Hours</CardTitle></CardHeader>
          <CardContent className="h-72 overflow-visible">
            {data.shift_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" className="overflow-visible">
                <PieChart>
                  <Pie
                    data={data.shift_breakdown}
                    dataKey="hours"
                    nameKey="name"
                    outerRadius={80}
                    innerRadius={36}
                    paddingAngle={3}
                    label={({ cx, cy, midAngle, outerRadius, percent, name }) => {
                      const RAD = Math.PI / 180;
                      const radius = outerRadius + 18;
                      const x = cx + radius * Math.cos(-midAngle * RAD);
                      const y = cy + radius * Math.sin(-midAngle * RAD);
                      return (
                        <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central"
                          className="text-xs fill-stone-600" fontSize={12}>
                          {name} ({(percent * 100).toFixed(0)}%)
                        </text>
                      );
                    }}
                    labelLine={{ stroke: "#a8a29e", strokeWidth: 1 }}
                  >
                    {data.shift_breakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}h`, "Hours"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="No shift data yet" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Utilization tables ──────────────────────────────── */}
      {/* {(data.most_utilized.length > 0 || data.least_utilized.length > 0) && (
        <div className="grid gap-5 xl:grid-cols-2">
          <UtilTable title={<><TrendingUp className="h-4 w-4 text-rose-500" /> Most Utilized</>} rows={data.most_utilized}  accent="text-rose-600 bg-rose-50" />
          <UtilTable title={<><TrendingDown className="h-4 w-4 text-sky-500" /> Least Utilized</>} rows={data.least_utilized} accent="text-sky-600 bg-sky-50" />
        </div>
      )} */}

      {/* ── Overtime & under-utilization alerts ─────────────── */}
      {data.overtime.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-danger flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Overtime Alert — {data.overtime.length} officer(s) exceed 48 hrs
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.overtime.map((r) => (
              <span key={r.name} className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                {r.name} — {r.hours}h
              </span>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── helpers ──────────────────────────────────────────────── */

function BarCard({ title, data, xKey, yKey, color }: {
  title: string; data: any[]; xKey: string; yKey: string; color: string;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
                cursor={{ fill: `${color}14` }}
              />
              <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="No data yet" />
        )}
      </CardContent>
    </Card>
  );
}

function UtilTable({ title, rows, accent }: { title: React.ReactNode; rows: { name: string; hours: number }[]; accent: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2">{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        {rows.map((r, i) => (
          <div key={r.name} className={`flex items-center justify-between px-5 py-3 ${i < rows.length - 1 ? "border-b border-border" : ""}`}>
            <span className="text-sm font-medium text-foreground">{r.name}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${accent}`}>{r.hours}h</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-muted-fg">{label}</div>
  );
}
