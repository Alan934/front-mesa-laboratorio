'use client'

import React, { useEffect, useMemo, useState } from 'react'

// Local types mirroring backend DTOs
type Role = 'CLIENT' | 'PRACTITIONER' | 'ADMIN'

type User = {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  dni?: string | null
  phone?: string | null
  profession?: string | null
  professionId?: string | null
  role: Role
}

type Profession = { id: string; name: string }

type WorkingIntervalDto = { id?: string; startTime: string; endTime: string }

type WorkingDayDto = { id?: string; dayOfWeek: string; intervals: WorkingIntervalDto[] }

type WorkingIntervalUpsertRequest = { startTime: string; endTime: string }

type WorkingDayUpsertRequest = { dayOfWeek: string; intervals: WorkingIntervalUpsertRequest[] }

const DAYS: { key: string; label: string }[] = [
  { key: 'MONDAY', label: 'Lunes' },
  { key: 'TUESDAY', label: 'Martes' },
  { key: 'WEDNESDAY', label: 'Miércoles' },
  { key: 'THURSDAY', label: 'Jueves' },
  { key: 'FRIDAY', label: 'Viernes' },
  { key: 'SATURDAY', label: 'Sábado' },
  { key: 'SUNDAY', label: 'Domingo' },
]

function toHHmm(time: string | undefined | null): string {
  if (!time) return ''
  // Accept HH:mm or HH:mm:ss
  const [h, m] = time.split(':')
  if (h && m) return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
  return ''
}

export default function ProfilePage() {
  const [me, setMe] = useState<User | null>(null)
  const [professions, setProfessions] = useState<Profession[]>([])
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
    professionId: '',
    profession: '',
  })

  // Practitioner schedule state
  const [schedule, setSchedule] = useState<Record<string, WorkingIntervalDto[]>>({})

  const isPractitioner = me?.role === 'PRACTITIONER'

  const selectedProfession = useMemo(
    () => professions.find((p) => p.id === form.professionId),
    [professions, form.professionId]
  )

  async function fetchMe(): Promise<User> {
    const res = await fetch('/api/proxy/users/me', { cache: 'no-store' })
    if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`)
    return res.json()
  }

  async function fetchProfessions(): Promise<Profession[]> {
    const res = await fetch('/api/proxy/professions', { cache: 'no-store' })
    if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`)
    return res.json()
  }

  async function fetchSchedule(): Promise<WorkingDayDto[]> {
    const res = await fetch('/api/proxy/users/me/schedule', { cache: 'no-store' })
    if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`)
    return res.json()
  }

  function initSchedule(days: WorkingDayDto[]) {
    const map: Record<string, WorkingIntervalDto[]> = {}
    DAYS.forEach((d) => (map[d.key] = []))
    for (const d of days) {
      map[d.dayOfWeek] = (d.intervals || []).map((i) => ({
        startTime: toHHmm(i.startTime),
        endTime: toHHmm(i.endTime),
      }))
    }
    setSchedule(map)
  }

  async function load() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const [meData, profs] = await Promise.all([fetchMe(), fetchProfessions()])
      setMe(meData)
      setProfessions(profs)
      setForm({
        firstName: meData.firstName || '',
        lastName: meData.lastName || '',
        dni: meData.dni || '',
        phone: meData.phone || '',
        professionId: meData.professionId || '',
        profession: meData.profession || '',
      })
      if (meData.role === 'PRACTITIONER') {
        const days = await fetchSchedule()
        initSchedule(days)
      }
    } catch (e: any) {
      setError(e?.message || 'Error loading profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateInterval(dayKey: string, idx: number, field: 'startTime' | 'endTime', val: string) {
    setSchedule((prev) => {
      const copy = { ...prev }
      const arr = [...(copy[dayKey] || [])]
      const item = { ...arr[idx], [field]: val }
      arr[idx] = item
      copy[dayKey] = arr
      return copy
    })
  }

  function addInterval(dayKey: string) {
    setSchedule((prev) => ({ ...prev, [dayKey]: [...(prev[dayKey] || []), { startTime: '', endTime: '' }] }))
  }

  function removeInterval(dayKey: string, idx: number) {
    setSchedule((prev) => {
      const arr = [...(prev[dayKey] || [])]
      arr.splice(idx, 1)
      return { ...prev, [dayKey]: arr }
    })
  }

  function toggleDay(dayKey: string, enabled: boolean) {
    setSchedule((prev) => {
      const next = { ...prev }
      if (enabled && (!next[dayKey] || next[dayKey].length === 0)) {
        next[dayKey] = [{ startTime: '', endTime: '' }]
      }
      if (!enabled) {
        next[dayKey] = []
      }
      return next
    })
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSavingProfile(true)
    try {
      const payload: any = {
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        dni: form.dni || undefined,
        phone: form.phone || undefined,
      }
      if (isPractitioner) {
        if (form.professionId && form.professionId !== '__other') payload.professionId = form.professionId
        else if (form.profession) payload.profession = form.profession
      }
      const res = await fetch('/api/proxy/users/me', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`)
      const updated = (await res.json()) as User
      setMe(updated)
      setSuccess('Perfil actualizado')
    } catch (e: any) {
      setError(e?.message || 'Error al guardar el perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  function buildSchedulePayload(): WorkingDayUpsertRequest[] {
    const payload: WorkingDayUpsertRequest[] = []
    for (const d of DAYS) {
      const intervals = (schedule[d.key] || []).filter((i) => i.startTime && i.endTime).map((i) => ({
        startTime: i.startTime.length === 5 ? `${i.startTime}:00` : i.startTime,
        endTime: i.endTime.length === 5 ? `${i.endTime}:00` : i.endTime,
      }))
      if (intervals.length > 0) payload.push({ dayOfWeek: d.key, intervals })
    }
    return payload
  }

  async function saveSchedule(e: React.FormEvent) {
    e.preventDefault()
    if (!isPractitioner) return
    setError(null)
    setSuccess(null)
    setSavingSchedule(true)
    try {
      const body = JSON.stringify(buildSchedulePayload())
      const res = await fetch('/api/proxy/users/me/schedule', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body,
      })
      if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`)
      setSuccess('Horario actualizado')
    } catch (e: any) {
      setError(e?.message || 'Error al guardar el horario')
    } finally {
      setSavingSchedule(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="animate-pulse h-32 rounded-lg bg-slate-200/70 dark:bg-gray-800/70" />
      </div>
    )
  }

  if (!me) {
    return (
      <div className="mx-auto max-w-5xl p-6 text-slate-700 dark:text-gray-300">No user data.</div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl p-6 grid gap-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Mi Perfil</h1>

      {error && (
        <div className="rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-1 ring-rose-700/20 px-3 py-2 text-sm">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-700/20 px-3 py-2 text-sm">{success}</div>
      )}

      {/* Profile form */}
      <form onSubmit={saveProfile} className="rounded-xl bg-white/70 dark:bg-gray-900/50 shadow-sm ring-1 ring-slate-200/70 dark:ring-gray-800/70 p-5 sm:p-6 grid gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 dark:text-gray-400">Nombre</label>
            <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 dark:text-gray-400">Apellido</label>
            <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 dark:text-gray-400">DNI</label>
            <input value={form.dni} onChange={(e) => setForm((f) => ({ ...f, dni: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 dark:text-gray-400">Celular</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm" />
          </div>
        </div>

        {isPractitioner && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-gray-400">Profesión</label>
              <select
                className="mt-1 w-full rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                value={form.professionId || ''}
                onChange={(e) => setForm((f) => ({ ...f, professionId: e.target.value, profession: '' }))}
              >
                <option value="">-- Seleccionar --</option>
                {professions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="__other">Otra…</option>
              </select>
            </div>
            {form.professionId === '__other' && (
              <div>
                <label className="block text-sm text-slate-600 dark:text-gray-400">Otra profesión</label>
                <input value={form.profession} onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm" />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button type="submit" disabled={savingProfile} className="inline-flex items-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-gray-900 px-3 py-2 text-sm font-medium shadow-sm disabled:opacity-50">
            {savingProfile ? 'Guardando…' : 'Guardar perfil'}
          </button>
        </div>
      </form>

      {/* Schedule editor for practitioners */}
      {isPractitioner && (
        <form onSubmit={saveSchedule} className="rounded-xl bg-white/70 dark:bg-gray-900/50 shadow-sm ring-1 ring-slate-200/70 dark:ring-gray-800/70 p-5 sm:p-6 grid gap-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-100">Horario de trabajo</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DAYS.map((d) => {
              const enabled = (schedule[d.key] || []).length > 0
              return (
                <div key={d.key} className="rounded-lg border border-slate-200/70 dark:border-gray-800/70 p-4">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-slate-800 dark:text-gray-100">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={enabled}
                        onChange={(e) => toggleDay(d.key, e.target.checked)}
                      />
                      {d.label}
                    </label>
                    <button type="button" onClick={() => addInterval(d.key)} className="text-xs rounded-md border px-2 py-1">+ Añadir franja</button>
                  </div>

                  {enabled && (
                    <div className="mt-3 grid gap-2">
                      {(schedule[d.key] || []).map((i, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="time"
                            value={i.startTime}
                            onChange={(e) => updateInterval(d.key, idx, 'startTime', e.target.value)}
                            className="w-32 rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-2 py-1 text-sm"
                          />
                          <span className="text-sm">a</span>
                          <input
                            type="time"
                            value={i.endTime}
                            onChange={(e) => updateInterval(d.key, idx, 'endTime', e.target.value)}
                            className="w-32 rounded-md border border-slate-300/70 dark:border-gray-700 bg-white dark:bg-gray-950 px-2 py-1 text-sm"
                          />
                          <button type="button" onClick={() => removeInterval(d.key, idx)} className="text-xs rounded-md border px-2 py-1">Eliminar</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-end">
            <button type="submit" disabled={savingSchedule} className="inline-flex items-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-gray-900 px-3 py-2 text-sm font-medium shadow-sm disabled:opacity-50">
              {savingSchedule ? 'Guardando…' : 'Guardar horario'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
