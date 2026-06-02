import {
  BarChart3, CalendarCheck, FileSpreadsheet, History,
  LayoutDashboard, LogOut, Shield, Upload, Users, UserCog,
} from "lucide-react";
import { Component, useEffect, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { useAuth }        from "./contexts/AuthContext";
import { Dashboard }      from "./pages/Dashboard";
import { Officers }       from "./pages/Officers";
import { ExcelUpload }    from "./pages/ExcelUpload";
import { Duties }         from "./pages/Duties";
import { GenerateRoster } from "./pages/GenerateRoster";
import { DailyRoster }    from "./pages/DailyRoster";
import { RosterHistory }  from "./pages/RosterHistory";
import { Reports }        from "./pages/Reports";
import { UserManagement } from "./pages/UserManagement";
import { Login }          from "./pages/Login";
// import { AuditLogs }      from "./pages/AuditLogs";

class PageErrorBoundary extends Component<
  { children: ReactNode; pageKey: string },
  { error: Error | null }
> {
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
  { id: "dashboard", label: "Dashboard",      icon: LayoutDashboard, component: Dashboard },
  { id: "officers",  label: "Officers",        icon: Shield,           component: Officers },
  { id: "upload",    label: "Excel Upload",    icon: Upload,           component: ExcelUpload },
  { id: "duties",    label: "Duties",          icon: CalendarCheck,    component: Duties },
  { id: "generate",  label: "Generate Roster", icon: BarChart3,        component: GenerateRoster },
  { id: "daily",     label: "Daily Roster",    icon: Users,            component: DailyRoster },
  { id: "history",   label: "Roster History",  icon: History,          component: RosterHistory },
  { id: "reports",   label: "Reports",         icon: FileSpreadsheet,  component: Reports },
  { id: "users",     label: "Users / Roles",   icon: UserCog,          component: UserManagement },
  // { id: "audit",     label: "Audit Logs",      icon: History,          component: AuditLogs },
];

export function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const [active, setActive] = useState(
    () => window.location.hash.replace("#/", "") || "dashboard"
  );
  const page = pages.find((p) => p.id === active) ?? pages[0];
  const Page = page.component;

  useEffect(() => {
    const sync = () => setActive(window.location.hash.replace("#/", "") || "dashboard");
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (isAuthenticated && !window.location.hash) {
      window.location.hash = "/dashboard";
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Login />;

  function navigate(id: string) {
    window.location.hash = `/${id}`;
    setActive(id);
    window.scrollTo(0, 0);
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="sticky top-0 h-screen overflow-y-auto bg-white flex flex-col border-r border-orange-100">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-orange-100">
          <div className="flex items-center gap-3">
            <img src="/anantapur_police_logo.jpg" alt="AP Police" className="h-10 w-auto rounded" />
            <div>
              <div className="text-[13px] font-bold text-stone-800 tracking-tight leading-tight">Anantapuram Police Department</div>
              <div className="text-[10px] text-stone-400 tracking-wide">Duty Roster Management System</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {pages.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={[
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium",
                  "transition-all duration-150 text-left",
                  isActive
                    ? "bg-orange-50 text-orange-700 border border-orange-200"
                    : "text-stone-600 hover:bg-gray-100 hover:text-stone-900",
                ].join(" ")}
              >
                <Icon className={[
                  "h-4 w-4 shrink-0",
                  isActive ? "text-orange-600" : "text-stone-400",
                ].join(" ")} />
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-orange-100">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[10px] text-stone-400">Powered by</span>
            <img src="/incuxai_logo.jpeg" alt="INCUXAI" className="h-5 w-auto rounded-sm" />
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-orange-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* <img src="/anantapur_police_logo.jpg" alt="AP Police" className="h-12 w-auto rounded" /> */}
            <div>
              <h1 className="text-lg font-semibold text-stone-800 tracking-tight">{page.label}</h1>
              {/* <p className="text-xs text-stone-400 mt-0.5">Police Duty Roster Management System</p> */}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500">{user?.name}</span>
            <button onClick={logout} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-600 transition-colors">
              <LogOut className="h-3.5 w-3.5" />
              Logout
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
