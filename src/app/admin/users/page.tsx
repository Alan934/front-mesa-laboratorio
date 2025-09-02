"use client";

import { useEffect, useMemo, useState } from "react";

type Role = "ADMIN" | "PRACTITIONER" | "CLIENT";

type User = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: Role;
  dni?: string | null;
  phone?: string | null;
  profession?: string | null; // name
  professionId?: string | null; // id
};

type UpdatePayload = {
  email: string | undefined;
  firstName: string | null;
  lastName: string | null;
  role: Role | undefined;
  dni: string | null;
  phone: string | null;
  professionId: string | null;
};

type Profession = { id: string; name: string };

export default function AdminUsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<User>>({});
  const [professions, setProfessions] = useState<Profession[]>([]);

  const byId = useMemo(() => Object.fromEntries(items.map(u => [u.id, u])), [items]);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/proxy/admin/users", { cache: "no-store" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: User[] = await res.json();
      setItems(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error inesperado";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function loadProfessions() {
    try {
      const res = await fetch("/api/proxy/professions", { cache: "no-store" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: Profession[] = await res.json();
      setProfessions(data);
    } catch (e) {
      // Soft-fail; keep UI usable
      console.error("Failed to load professions", e);
    }
  }

  useEffect(() => {
    loadUsers();
    loadProfessions();
  }, []);

  function startEdit(id: string) {
    const u = byId[id];
    setEditingId(id);
    // Ensure we carry over professionId if present; if not, try to infer from name
    let professionId = u.professionId || null;
    if (!professionId && u.profession) {
      const match = professions.find(p => p.name === u.profession);
      professionId = match ? match.id : null;
    }
    setForm({ ...u, professionId });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({});
  }

  async function load() {
    await Promise.all([loadUsers(), loadProfessions()]);
  }

  async function saveEdit() {
    if (!editingId) return;
    setError(null);
    try {
      const payload: UpdatePayload = {
        email: form.email,
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        role: form.role,
        dni: form.dni || null,
        phone: form.phone || null,
        professionId: form.role === "PRACTITIONER" ? (form.professionId || null) : null,
      };
      if (payload.role === "PRACTITIONER" && (!payload.professionId || String(payload.professionId).trim() === "")) {
        throw new Error("La profesión es obligatoria para profesionales");
      }
      const res = await fetch(`/api/proxy/admin/users/${editingId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }
      setEditingId(null);
      setForm({});
      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error inesperado";
      setError(message);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar usuario? Esta acción no se puede deshacer.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/proxy/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }
      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error inesperado";
      setError(message);
    }
  }

  function fullName(u: User) {
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return name || u.email;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
            Admin • Usuarios
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">Gestioná usuarios: editá o eliminá.</p>
        </div>
        <button
          onClick={load}
          className="hidden sm:inline-flex items-center rounded-md border border-slate-300/70 dark:border-gray-700 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800 transition"
        >
          Actualizar
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
        <div className="mt-6 text-sm text-slate-600 dark:text-gray-400">Sin usuarios.</div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((u) => (
            <li key={u.id} className="rounded-lg border border-slate-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-950 p-4 shadow-sm">
              {editingId === u.id ? (
                <div className="grid grid-cols-1 gap-3">
                  <div className="text-sm font-semibold text-slate-800 dark:text-gray-100">Editar usuario</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="grid gap-1.5">
                      <span className="text-xs text-slate-600 dark:text-gray-400">Email</span>
                      <input
                        type="email"
                        value={form.email || ""}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        className="rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                        required
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs text-slate-600 dark:text-gray-400">Rol</span>
                      <select
                        value={form.role || "CLIENT"}
                        onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
                        className="rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                        required
                      >
                        <option value="CLIENT">CLIENT</option>
                        <option value="PRACTITIONER">PRACTITIONER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs text-slate-600 dark:text-gray-400">Nombre</span>
                      <input
                        type="text"
                        value={form.firstName || ""}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                        className="rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs text-slate-600 dark:text-gray-400">Apellido</span>
                      <input
                        type="text"
                        value={form.lastName || ""}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                        className="rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs text-slate-600 dark:text-gray-400">DNI</span>
                      <input
                        type="text"
                        value={form.dni || ""}
                        onChange={(e) => setForm((f) => ({ ...f, dni: e.target.value }))}
                        className="rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs text-slate-600 dark:text-gray-400">Teléfono</span>
                      <input
                        type="tel"
                        value={form.phone || ""}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        className="rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="grid gap-1.5 sm:col-span-2">
                      <span className="text-xs text-slate-600 dark:text-gray-400">Profesión</span>
                      <select
                        value={form.professionId || ""}
                        onChange={(e) => {
                          const pid = e.target.value || null;
                          const p = professions.find(x => x.id === pid) || null;
                          setForm((f) => ({ ...f, professionId: pid, profession: p?.name || null }));
                        }}
                        className="rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                        disabled={form.role !== "PRACTITIONER"}
                      >
                        <option value="">{form.role === "PRACTITIONER" ? "Selecciona una profesión" : "No aplica"}</option>
                        {professions.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      {form.role === "PRACTITIONER" && !form.professionId && (
                        <span className="text-[11px] text-rose-600 dark:text-rose-400">Requerido para PRACTITIONER</span>
                      )}
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="inline-flex items-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-gray-900 px-3 py-1.5 text-sm font-semibold shadow-sm hover:opacity-90 active:opacity-80">
                      Guardar
                    </button>
                    <button onClick={cancelEdit} className="inline-flex items-center rounded-md border border-slate-300/70 dark:border-gray-700 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-gray-100">{fullName(u)}</div>
                    <div className="text-xs text-slate-600 dark:text-gray-400">{u.email}</div>
                    <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600 dark:text-gray-400">
                      <div><span className="font-medium">Rol:</span> {u.role}</div>
                      <div><span className="font-medium">DNI:</span> {u.dni || "-"}</div>
                      <div><span className="font-medium">Teléfono:</span> {u.phone || "-"}</div>
                      <div><span className="font-medium">Profesión:</span> {u.profession || "-"}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => startEdit(u.id)}
                      className="inline-flex items-center justify-center rounded-md bg-indigo-600 text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm hover:opacity-90 active:opacity-80"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => remove(u.id)}
                      className="inline-flex items-center justify-center rounded-md bg-rose-600 text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm hover:opacity-90 active:opacity-80"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="sm:hidden">
        <button
          onClick={load}
          className="mt-4 inline-flex items-center rounded-md border border-slate-300/70 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800 transition"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}
