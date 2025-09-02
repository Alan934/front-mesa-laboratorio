"use client";

import { useEffect, useMemo, useState } from "react";

type Appointment = {
  id: string;
  clientId: string;
  clientName?: string; // display name
  practitionerId?: string | null;
  startAt: string;
  endAt: string;
  status: "PENDING" | "APPROVED" | "CANCELED";
  description?: string;
};

type Practitioner = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export default function AdminAppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);

  const practitionersById = useMemo(() => Object.fromEntries(practitioners.map(p => [p.id, p])), [practitioners]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [appsRes, practRes] = await Promise.all([
        fetch("/api/proxy/admin/appointments", { cache: "no-store" }),
        fetch("/api/proxy/users/practitioners", { cache: "no-store" }),
      ]);
      if (!appsRes.ok) throw new Error(`Error ${appsRes.status}`);
      if (!practRes.ok) throw new Error(`Error ${practRes.status}`);
      const [apps, practs] = await Promise.all([appsRes.json(), practRes.json()]);
      setItems(apps);
      setPractitioners(practs);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    setError(null);
    const res = await fetch(`/api/proxy/admin/appointments/${id}/approve`, { method: "POST" });
    if (!res.ok) {
      const text = await res.text();
      setError(text || `Error ${res.status}`);
    }
    await load();
  }

  async function cancel(id: string) {
    setError(null);
    const res = await fetch(`/api/proxy/admin/appointments/${id}/cancel`, { method: "POST" });
    if (!res.ok) {
      const text = await res.text();
      setError(text || `Error ${res.status}`);
    }
    await load();
  }

  const statusStyles: Record<Appointment["status"], string> = {
    PENDING:
      "bg-amber-100 text-amber-800 ring-1 ring-amber-700/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-300/20",
    APPROVED:
      "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-700/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-300/20",
    CANCELED:
      "bg-rose-100 text-rose-800 ring-1 ring-rose-700/20 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-300/20",
  };

  function fullName(p: Practitioner | undefined) {
    if (!p) return "";
    const name = [p.firstName, p.lastName].filter(Boolean).join(" ");
    return name || p.email;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
            Admin • Appointments
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">Review, approve or cancel appointments.</p>
        </div>
        <button
          onClick={load}
          className="hidden sm:inline-flex items-center rounded-md border border-slate-300/70 dark:border-gray-700 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800 transition"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-1 ring-rose-700/20 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-3">
          <div className="animate-pulse h-20 rounded-lg bg-slate-200/70 dark:bg-gray-800/70" />
          <div className="animate-pulse h-20 rounded-lg bg-slate-200/70 dark:bg-gray-800/70" />
          <div className="animate-pulse h-20 rounded-lg bg-slate-200/70 dark:bg-gray-800/70" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 text-sm text-slate-600 dark:text-gray-400">No appointments.</div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((a) => (
            <li key={a.id} className="rounded-lg border border-slate-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-950 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[a.status]}`}>
                    {a.status}
                  </div>
                  <div className="mt-2 font-medium text-slate-900 dark:text-gray-100">
                    {new Date(a.startAt).toLocaleString()} → {new Date(a.endAt).toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-gray-400">
                    Client: {a.clientName || <code className="text-[11px]">{a.clientId}</code>}
                  </div>
                  {a.practitionerId && (
                    <div className="mt-0.5 text-xs text-slate-600 dark:text-gray-400">
                      Practitioner: {fullName(practitionersById[a.practitionerId]) || a.practitionerId}
                    </div>
                  )}
                  {a.description && (
                    <div className="mt-1 text-sm text-slate-600 dark:text-gray-400 line-clamp-2">{a.description}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => approve(a.id)}
                    disabled={a.status !== "PENDING"}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm hover:opacity-90 active:opacity-80 disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => cancel(a.id)}
                    disabled={a.status === "CANCELED"}
                    className="inline-flex items-center justify-center rounded-md bg-rose-600 text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm hover:opacity-90 active:opacity-80 disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="sm:hidden">
        <button
          onClick={load}
          className="mt-4 inline-flex items-center rounded-md border border-slate-300/70 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800 transition"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}