
'use client'

import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Home,
  ShieldCheck,
  CalendarDays,
  Users,
  X,
  Clock,
  MapPin,
  ClipboardList,
  UserRound,
} from 'lucide-react'

type TabType = 'kobong' | 'patroli'

interface KobongRow {
  id: string
  hari: string
  kobong: string
  tugas: string
  shift: string
  penanggung_jawab: string
}

interface PatroliRow {
  id: string
  hari: string
  shift_malam: string
  regu: string
  ustadz_pembina: string
  posjaga_jalur: string
}

const days = [
  'Senin', 'Selasa', 'Rabu', 'Kamis',
  'Jumat', 'Sabtu', 'Minggu',
]

const initialForm = {
  hari: 'Senin',
  kobong: '',
  tugas: '',
  shift: 'Pagi',
  penanggung_jawab: '',
  shift_malam: '',
  regu: '',
  ustadz_pembina: '',
  posjaga_jalur: '',
}

export default function JadwalPiketPage() {
  const [activeTab, setActiveTab] = useState<TabType>('kobong')

  const [kobongData, setKobongData] = useState<KobongRow[]>([])
  const [patroliData, setPatroliData] = useState<PatroliRow[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(initialForm)

  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')

    const [kobongResult, patroliResult] = await Promise.all([
      supabase
        .from('jadwal_piket_kobong')
        .select('*')
        .order('created_at', { ascending: false }),

      supabase
        .from('jadwal_piket_patroli')
        .select('*')
        .order('created_at', { ascending: false }),
    ])

    if (kobongResult.error || patroliResult.error) {
      setError(
        kobongResult.error?.message ||
        patroliResult.error?.message ||
        'Gagal mengambil data.'
      )
    } else {
      setKobongData(kobongResult.data || [])
      setPatroliData(patroliResult.data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const openAddModal = () => {
    setEditingId(null)
    setForm(initialForm)
    setModalOpen(true)
  }

  const openEditModal = (row: KobongRow | PatroliRow) => {
    setEditingId(row.id)

    if (activeTab === 'kobong') {
      const item = row as KobongRow

      setForm({
        ...initialForm,
        hari: item.hari,
        kobong: item.kobong,
        tugas: item.tugas,
        shift: item.shift,
        penanggung_jawab: item.penanggung_jawab,
      })
    } else {
      const item = row as PatroliRow

      setForm({
        ...initialForm,
        hari: item.hari,
        shift_malam: item.shift_malam,
        regu: item.regu,
        ustadz_pembina: item.ustadz_pembina,
        posjaga_jalur: item.posjaga_jalur,
      })
    }

    setModalOpen(true)
  }

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Silakan login terlebih dahulu.')
      }

      let result

      if (activeTab === 'kobong') {
        const payload = {
          hari: form.hari,
          kobong: form.kobong,
          tugas: form.tugas,
          shift: form.shift,
          penanggung_jawab: form.penanggung_jawab,
        }

        result = editingId
          ? await supabase
              .from('jadwal_piket_kobong')
              .update(payload)
              .eq('id', editingId)
          : await supabase
              .from('jadwal_piket_kobong')
              .insert([payload])
      } else {
        const payload = {
          hari: form.hari,
          shift_malam: form.shift_malam,
          regu: form.regu,
          ustadz_pembina: form.ustadz_pembina,
          posjaga_jalur: form.posjaga_jalur,
        }

        result = editingId
          ? await supabase
              .from('jadwal_piket_patroli')
              .update(payload)
              .eq('id', editingId)
          : await supabase
              .from('jadwal_piket_patroli')
              .insert([payload])
      }

      if (result.error) throw result.error

      setModalOpen(false)
      setForm(initialForm)
      setEditingId(null)
      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan data.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Apakah kamu yakin ingin menghapus jadwal ini?'
    )

    if (!confirmed) return

    const table =
      activeTab === 'kobong'
        ? 'jadwal_piket_kobong'
        : 'jadwal_piket_patroli'

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    await loadData()
  }

  const filteredKobong = kobongData.filter((item) =>
    [
      item.hari,
      item.kobong,
      item.tugas,
      item.shift,
      item.penanggung_jawab,
    ]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const filteredPatroli = patroliData.filter((item) =>
    [
      item.hari,
      item.shift_malam,
      item.regu,
      item.ustadz_pembina,
      item.posjaga_jalur,
    ]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const inputClass =
    'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30'

  const labelClass =
    'mb-2 block text-sm font-medium text-foreground'

  return (
    <div className="min-h-screen space-y-6 p-5 text-foreground">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              Jadwal Piket
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
              Pesantren
            </span>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Kelola jadwal piket kobong dan patroli santri.
          </p>
        </div>
      </div>

      {/* STATISTIK */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-600">
              <CalendarDays size={22} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Total Piket Kobong
              </p>
              <h2 className="text-2xl font-bold">
                {kobongData.length}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-3 text-blue-600">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Total Piket Patroli
              </p>
              <h2 className="text-2xl font-bold">
                {patroliData.length}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-500/10 p-3 text-violet-600">
              <Users size={22} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Total Seluruh Jadwal
              </p>
              <h2 className="text-2xl font-bold">
                {kobongData.length + patroliData.length}
              </h2>
            </div>
          </div>
        </div>

      </div>

      {/* PILIHAN DATA */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">

        <button
          onClick={() => {
            setActiveTab('kobong')
            setSearch('')
            setError('')
          }}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            activeTab === 'kobong'
              ? 'bg-emerald-600 text-white'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Home size={17} />
          Piket Kobong
        </button>

        <button
          onClick={() => {
            setActiveTab('patroli')
            setSearch('')
            setError('')
          }}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            activeTab === 'patroli'
              ? 'bg-blue-600 text-white'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <ShieldCheck size={17} />
          Piket Patroli
        </button>

      </div>

      {/* SEARCH DAN TAMBAH */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row">

        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            type="text"
            placeholder={
              activeTab === 'kobong'
                ? 'Cari hari, kobong, tugas...'
                : 'Cari hari, regu, ustadz, pos jaga...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Plus size={18} />
          {activeTab === 'kobong'
            ? 'Tambah Piket Kobong'
            : 'Tambah Piket Patroli'}
        </button>

      </div>

      {/* PESAN ERROR */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* TABEL PIKET KOBONG */}
      {activeTab === 'kobong' && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">

          <div className="border-b border-border p-4">
            <h3 className="font-semibold">Daftar Piket Kobong</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Total {filteredKobong.length} jadwal ditemukan
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">

              <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">Hari</th>
                  <th className="px-5 py-4">Kobong</th>
                  <th className="px-5 py-4">Tugas</th>
                  <th className="px-5 py-4">Shift</th>
                  <th className="px-5 py-4">Penanggung Jawab</th>
                  <th className="px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">

                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredKobong.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Belum ada jadwal piket kobong.
                    </td>
                  </tr>
                ) : (
                  filteredKobong.map((item) => (
                    <tr key={item.id} className="transition hover:bg-muted/40">

                      <td className="px-5 py-4 font-semibold">
                        {item.hari}
                      </td>

                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2">
                          <Home size={16} className="text-emerald-600" />
                          {item.kobong}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {item.tugas}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600">
                          {item.shift}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2">
                          <UserRound size={15} className="text-muted-foreground" />
                          {item.penanggung_jawab}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit"
                            className="text-amber-500 hover:text-amber-600"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Hapus"
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABEL PIKET PATROLI */}
      {activeTab === 'patroli' && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">

          <div className="border-b border-border p-4">
            <h3 className="font-semibold">Daftar Piket Patroli</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Total {filteredPatroli.length} jadwal ditemukan
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">

              <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">Hari</th>
                  <th className="px-5 py-4">Shift Malam</th>
                  <th className="px-5 py-4">Regu</th>
                  <th className="px-5 py-4">Ustadz Pembina</th>
                  <th className="px-5 py-4">Pos Jaga & Jalur</th>
                  <th className="px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">

                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredPatroli.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Belum ada jadwal piket patroli.
                    </td>
                  </tr>
                ) : (
                  filteredPatroli.map((item) => (
                    <tr key={item.id} className="transition hover:bg-muted/40">

                      <td className="px-5 py-4 font-semibold">
                        {item.hari}
                      </td>

                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2">
                          <Clock size={16} className="text-blue-600" />
                          {item.shift_malam}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600">
                          {item.regu}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2">
                          <UserRound size={15} className="text-muted-foreground" />
                          {item.ustadz_pembina}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2">
                          <MapPin size={16} className="text-emerald-600" />
                          {item.posjaga_jalur}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit"
                            className="text-amber-500 hover:text-amber-600"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Hapus"
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-card shadow-xl">

            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-lg font-bold">
                  {editingId ? 'Edit Jadwal' : 'Tambah Jadwal'}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeTab === 'kobong'
                    ? 'Formulir jadwal piket kobong'
                    : 'Formulir jadwal piket patroli'}
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 p-5">

              {/* HARI */}
              <div>
                <label className={labelClass}>Hari</label>
                <select
                  className={inputClass}
                  value={form.hari}
                  onChange={(e) =>
                    setForm({ ...form, hari: e.target.value })
                  }
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === 'kobong' ? (
                <>
                  <div>
                    <label className={labelClass}>Kobong</label>
                    <input
                      required
                      className={inputClass}
                      placeholder="Contoh: Kobong Al-Falah"
                      value={form.kobong}
                      onChange={(e) =>
                        setForm({ ...form, kobong: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Tugas</label>
                    <textarea
                      required
                      rows={3}
                      className={inputClass}
                      placeholder="Contoh: Membersihkan kamar dan halaman"
                      value={form.tugas}
                      onChange={(e) =>
                        setForm({ ...form, tugas: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Shift</label>
                    <select
                      className={inputClass}
                      value={form.shift}
                      onChange={(e) =>
                        setForm({ ...form, shift: e.target.value })
                      }
                    >
                      <option value="Pagi">Pagi</option>
                      <option value="Siang">Siang</option>
                      <option value="Sore">Sore</option>
                      <option value="Malam">Malam</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Penanggung Jawab</label>
                    <input
                      required
                      className={inputClass}
                      placeholder="Nama penanggung jawab"
                      value={form.penanggung_jawab}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          penanggung_jawab: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className={labelClass}>Shift Malam</label>
                    <input
                      required
                      className={inputClass}
                      placeholder="Contoh: 22.00 - 00.00"
                      value={form.shift_malam}
                      onChange={(e) =>
                        setForm({ ...form, shift_malam: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Regu</label>
                    <input
                      required
                      className={inputClass}
                      placeholder="Contoh: Regu 1"
                      value={form.regu}
                      onChange={(e) =>
                        setForm({ ...form, regu: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Ustadz Pembina</label>
                    <input
                      required
                      className={inputClass}
                      placeholder="Nama ustadz pembina"
                      value={form.ustadz_pembina}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          ustadz_pembina: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Pos Jaga & Jalur</label>
                    <textarea
                      required
                      rows={3}
                      className={inputClass}
                      placeholder="Contoh: Gerbang utama, asrama putra, halaman belakang"
                      value={form.posjaga_jalur}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          posjaga_jalur: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving
                    ? 'Menyimpan...'
                    : editingId
                      ? 'Simpan Perubahan'
                      : 'Simpan Jadwal'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
