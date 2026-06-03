import type { Assignment, DashboardAnalytics, Duty, Officer } from "@/types/domain";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: Record<string, string> = {
    ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> || {}),
  };
  const response = await fetch(path, { ...init, headers });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || response.statusText);
  }
  return response.json() as Promise<T>;
}

export function downloadUrl(path: string) {
  if (typeof window === "undefined") return path;
  const token = localStorage.getItem("auth_token");
  const url = new URL(path, window.location.origin);
  if (token) url.searchParams.set("token", token);
  return url.toString();
}

export const api = {
  analytics: () => request<DashboardAnalytics>("/api/analytics/dashboard"),
  officers: (search?: string) => request<Officer[]>(`/api/officers${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  createOfficer: (payload: Partial<Officer>) => request<Officer>("/api/officers", { method: "POST", body: JSON.stringify(payload) }),
  deleteOfficer: (id: number) => request(`/api/officers/${id}`, { method: "DELETE" }),
  skills: () => request<string[]>("/api/officers/skills"),
  uploadOfficers: (form: FormData) => request<{ imported: number }>("/api/officers/upload", { method: "POST", body: form }),
  duties: () => request<Duty[]>("/api/duties"),
  createDuty: (payload: Partial<Duty>) => request<Duty>("/api/duties", { method: "POST", body: JSON.stringify(payload) }),
  updateDuty: (id: number, payload: Partial<Duty>) => request<Duty>(`/api/duties/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  updateDutyStatus: (id: number, status: string) => request<Duty>(`/api/duties/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteDuty: (id: number) => request(`/api/duties/${id}`, { method: "DELETE" }),
  generateRoster: (payload: { date: string; station?: string; shift?: string; duty_ids?: number[] }) =>
    request<{ batch_id: number; fairness_score: number; assigned_count: number; unfilled: unknown[]; assignments: Assignment[] }>("/api/rosters/generate", {
      method: "POST", body: JSON.stringify(payload),
    }),
  dailyRoster: (date: string) => request<Assignment[]>(`/api/rosters/daily?date=${date}`),
  history: () => request<Array<{ id: number; date: string; station?: string; shift_type?: string; fairness_score: number; is_locked: boolean; created_at: string }>>("/api/rosters/history"),
  audit: () => request<Array<{ id: number; action: string; entity_type: string; details?: string; created_at: string }>>("/api/audit-logs"),
  users: () => request<Array<{ id: number; name: string; email: string; role: string; station_scope?: string; is_active: boolean }>>("/api/users"),
  createUser: (payload: { name: string; email: string; password: string; role: string; station_scope?: string }) =>
    request<{ id: number; name: string; email: string; role: string; station_scope?: string; is_active: boolean }>("/api/users", { method: "POST", body: JSON.stringify(payload) }),
};
