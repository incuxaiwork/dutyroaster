"use client";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, Component, type ReactNode, type ErrorInfo } from "react";
import {
  BarChart3, CalendarCheck, FileSpreadsheet, History,
  LayoutDashboard, LogOut, Shield, Upload, Users, UserCog,
} from "lucide-react";
import DashboardPage from "@/app/dashboard/page";
import OfficersPage from "@/app/officers/page";
import ExcelUploadPage from "@/app/upload/page";
import DutiesPage from "@/app/duties/page";
import GenerateRosterPage from "@/app/generate/page";
import DailyRosterPage from "@/app/daily/page";
import RosterHistoryPage from "@/app/history/page";
import ReportsPage from "@/app/reports/page";
import UserManagementPage from "@/app/users/page";
import LoginPage from "@/app/login/page";

class PageErrorBoundary extends Component<{ children: ReactNode; pageKey: string }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  componentDidCatch(e: Error, i: ErrorInfo) { console.error("Page crash:", e, i); }
  componentDidUpdate(prev: { pageKey: string }) {
    if (prev.pageKey !== this.props.pageKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (this.state.error) return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <strong>Page error:</strong> {String(this.state.error)}
      </div>
    );
    return this.props.children;
  }
}

const pages = [
  { id: "dashboard", label: "Dashboard",      icon: LayoutDashboard, component: DashboardPage },
  { id: "officers",  label: "Officers",        icon: Shield,          component: OfficersPage },
  { id: "upload",    label: "Excel Upload",    icon: Upload,          component: ExcelUploadPage },
  { id: "duties",    label: "Duties",          icon: CalendarCheck,   component: DutiesPage },
  { id: "generate",  label: "Generate Roster", icon: BarChart3,       component: GenerateRosterPage },
  { id: "daily",     label: "Daily Roster",    icon: Users,           component: DailyRosterPage },
  { id: "history",   label: "Roster History",  icon: History,         component: RosterHistoryPage },
  { id: "reports",   label: "Reports",         icon: FileSpreadsheet, component: ReportsPage },
  { id: "users",     label: "Users / Roles",   icon: UserCog,         component: UserManagementPage },
];

function Shell() {
  const { isAuthenticated, user, logout } = useAuth();
  const [active, setActive] = useState("dashboard");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const page = pages.find((p) => p.id === active) ?? pages[0];
  const Page = page.component;

  if (!mounted) return <div className="min-h-screen flex items-center justify-center text-stone-400 text-sm">Loading…</div>;
  if (!isAuthenticated) return <LoginPage />;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 h-screen overflow-y-auto bg-white flex flex-col border-r border-orange-100">
        <div className="px-5 py-5 border-b border-orange-100">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/anantapur_police_logo.jpg" alt="AP Police" className="h-10 w-auto rounded" />
            <div>
              <div className="text-[13px] font-bold text-stone-800 tracking-tight leading-tight">Anantapuram Police Department</div>
              <div className="text-[10px] text-stone-400 tracking-wide">Duty Roster Management System</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {pages.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button key={item.id} onClick={() => { setActive(item.id); window.scrollTo(0, 0); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 text-left ${
                  isActive ? "bg-orange-50 text-orange-700 border border-orange-200" : "text-stone-600 hover:bg-gray-100 hover:text-stone-900"
                }`}>
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-orange-600" : "text-stone-400"}`} />
                {item.label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />}
              </button>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-orange-100">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[10px] text-stone-400">Powered by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/incuxai_logo.jpeg" alt="INCUXAI" className="h-5 w-auto rounded-sm" />
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-orange-100 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-stone-800 tracking-tight">{page.label}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500">{user?.name}</span>
            <button onClick={logout} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-600 transition-colors">
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </header>
        <section className="flex-1 p-6 page-enter">
          <PageErrorBoundary pageKey={active}>
            <Page key={active} />
          </PageErrorBoundary>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
