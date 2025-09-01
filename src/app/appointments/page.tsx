"use client";

import { useEffect, useMemo, useState } from "react";

type Appointment = {
  id: string;
  clientId: string;
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

type Profession = { id: string; name: string };

function toInputLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

export default function AppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [selectedProfessionId, setSelectedProfessionId] = useState<string>("");
  const [practitionersLoading, setPractitionersLoading] = useState<boolean>(false);
  const [form, setForm] = useState({ practitionerId: "", startAt: "", endAt: "", description: "" });

  const practitionersById = useMemo(() => Object.fromEntries(practitioners.map(p => [p.id, p])), [practitioners]);

  const nowStr = toInputLocal(new Date());
  const minEndStr = form.startAt && form.startAt > nowStr ? form.startAt : nowStr;

  async function fetchProfessions(): Promise<Profession[]> {
    const res = await fetch("/api/proxy/professions", { cache: "no-store" });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
  }

  async function fetchPractitioners(professionId?: string): Promise<Practitioner[]> {
    const qs = professionId ? `?professionId=${encodeURIComponent(professionId)}` : "";
    const res = await fetch(`/api/proxy/users/practitioners${qs}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
  }

  async function fetchAppointments(): Promise<Appointment[]> {
    const res = await fetch("/api/proxy/appointments", { cache: "no-store" });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Load professions and appointments; do not auto-select profession/practitioner
      const [profs, apps] = await Promise.all([
        fetchProfessions(),
        fetchAppointments(),
      ]);
      setProfessions(profs);
      setItems(apps);
      // Keep current selections as-is; if invalid, they will be adjusted in the effect below
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When profession changes, refetch practitioners and keep appointments list intact
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!selectedProfessionId) {
          setPractitioners([]);
          setForm((f) => ({ ...f, practitionerId: "" }));
          return;
        }
        setPractitionersLoading(true);
        const practs = await fetchPractitioners(selectedProfessionId);
        if (!active) return;
        setPractitioners(practs);
        // If previously selected practitioner is not in the new list, clear selection
        if (!practs.find(p => p.id === form.practitionerId)) {
          setForm((f) => ({ ...f, practitionerId: "" }));
        }
      } catch (e: unknown) {
        if (!active) return;
        const message = e instanceof Error ? e.message : "Unexpected error";
        setError(message);
      } finally {
        if (active) setPractitionersLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProfessionId]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/proxy/appointments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          practitionerId: form.practitionerId,
          startAt: form.startAt,
          endAt: form.endAt,
          description: form.description || undefined,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }
      setForm({ practitionerId: "", startAt: "", endAt: "", description: "" });
      load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      setError(message);
    }
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
            My Appointments
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">Create and manage your appointments.</p>
        </div>
        <button
          onClick={load}
          className="hidden sm:inline-flex items-center rounded-md border border-slate-300/70 dark:border-gray-700 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800 transition"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form card */}
        <section className="lg:col-span-1 rounded-xl bg-white/70 dark:bg-gray-900/50 shadow-sm ring-1 ring-slate-200/70 dark:ring-gray-800/70 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-100">New appointment</h2>
          <form onSubmit={create} className="mt-4 grid grid-cols-1 gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Profession</span>
              <select
                value={selectedProfessionId}
                onChange={(e) => setSelectedProfessionId(e.target.value)}
                className="rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-slate-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              >
                <option value="">Selecciona una profesión</option>
                {professions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Practitioner</span>
              <select
                value={form.practitionerId}
                onChange={(e) => setForm((f) => ({ ...f, practitionerId: e.target.value }))}
                required
                disabled={!selectedProfessionId}
                className="rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-slate-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              >
                {!selectedProfessionId ? (
                  <option value="" disabled>
                    Selecciona una profesión
                  </option>
                ) : practitionersLoading ? (
                  <option value="" disabled>
                    Cargando profesionales...
                  </option>
                ) : practitioners.length === 0 ? (
                  <option value="" disabled>
                    No hay profesionales disponibles
                  </option>
                ) : (
                  <>
                    <option value="" disabled>
                      Selecciona un profesional
                    </option>
                    {practitioners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {fullName(p)}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {practitionersLoading && selectedProfessionId && (
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-slate-400/60 border-t-transparent rounded-full animate-spin" />
                  Cargando profesionales...
                </div>
              )}
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Start</span>
              <input
                type="datetime-local"
                value={form.startAt}
                min={nowStr}
                onChange={(e) => {
                  let v = e.target.value;
                  if (v && v < nowStr) v = nowStr;
                  setForm((f) => ({ ...f, startAt: v }));
                }}
                className="rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-slate-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                required
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-gray-300">End</span>
              <input
                type="datetime-local"
                value={form.endAt}
                min={minEndStr}
                onChange={(e) => {
                  let v = e.target.value;
                  const minE = minEndStr;
                  if (v && v < minE) v = minE;
                  setForm((f) => ({ ...f, endAt: v }));
                }}
                className="rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-slate-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                required
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Description</span>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-slate-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                maxLength={500}
                placeholder="Optional"
              />
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 text-sm font-semibold shadow-sm hover:opacity-90 active:opacity-80 transition"
                disabled={!form.practitionerId}
              >
                Create
              </button>
              <button
                type="button"
                onClick={load}
                className="inline-flex items-center justify-center rounded-md border border-slate-300/70 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800 transition"
              >
                Refresh
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-1 ring-rose-700/20 px-3 py-2 text-sm">
              {error}
            </div>
          )}
        </section>

        {/* List card */}
        <section className="lg:col-span-2 rounded-xl bg-white/70 dark:bg-gray-900/50 shadow-sm ring-1 ring-slate-200/70 dark:ring-gray-800/70 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-100">Upcoming</h2>
            <button
              onClick={load}
              className="sm:hidden inline-flex items-center rounded-md border border-slate-300/70 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800 transition"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-3">
              <div className="animate-pulse h-20 rounded-lg bg-slate-200/70 dark:bg-gray-800/70" />
              <div className="animate-pulse h-20 rounded-lg bg-slate-200/70 dark:bg-gray-800/70" />
              <div className="animate-pulse h-20 rounded-lg bg-slate-200/70 dark:bg-gray-800/70" />
            </div>
          ) : items.length === 0 ? (
            <div className="mt-6 text-sm text-slate-600 dark:text-gray-400">No appointments yet.</div>
          ) : (
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      {a.practitionerId && (
                        <div className="mt-1 text-xs text-slate-600 dark:text-gray-400">
                          With: {fullName(practitionersById[a.practitionerId]) || a.practitionerId}
                        </div>
                      )}
                      {a.description && (
                        <div className="mt-1 text-sm text-slate-600 dark:text-gray-400 line-clamp-2">{a.description}</div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
