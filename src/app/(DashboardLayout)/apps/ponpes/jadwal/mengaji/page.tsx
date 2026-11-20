
'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  BookOpen,
  Clock,
  CalendarDays,
  MapPin,
  Users,
  UserRound,
  Loader2
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

interface Jadwal {
  id: string;
  hari: string;
  waktu_mulai: string;
  waktu_selesai: string;
  jenis_pelajaran: string;
  pengajar: string;
  lokasi: string;
  kelompok: 'Putra' | 'Putri';
}

const daftarHari = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu'
];

const formAwal = {
  hari: 'Senin',
  waktu_mulai: '07:00',
  waktu_selesai: '08:00',
  jenis_pelajaran: '',
  pengajar: '',
  lokasi: '',
  kelompok: 'Putra' as 'Putra' | 'Putri'
};

export default function JadwalMengajiPage() {
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelompok, setFilterKelompok] = useState('Semua');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(formAwal);

  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchJadwal();
  }, []);

  // =====================================
  // AMBIL DATA JADWAL
  // =====================================

  async function fetchJadwal() {
    setLoading(true);

    const { data, error } = await supabase
      .from('jadwal_mengaji')
      .select('*');

    if (error) {
      console.error(error);
      setErrorMessage('Gagal mengambil data jadwal.');
    } else {
      const urutanHari = daftarHari;

      const sortedData = (data || []).sort((a, b) => {
        const hariA = urutanHari.indexOf(a.hari);
        const hariB = urutanHari.indexOf(b.hari);

        if (hariA !== hariB) return hariA - hariB;

        return a.waktu_mulai.localeCompare(b.waktu_mulai);
      });

      setJadwalList(sortedData);
    }

    setLoading(false);
  }

  // =====================================
  // BUKA MODAL TAMBAH
  // =====================================

  function handleTambah() {
    setEditingId(null);
    setForm(formAwal);
    setErrorMessage('');
    setModalOpen(true);
  }

  // =====================================
  // BUKA MODAL EDIT
  // =====================================

  function handleEdit(jadwal: Jadwal) {
    setEditingId(jadwal.id);

    setForm({
      hari: jadwal.hari,
      waktu_mulai: jadwal.waktu_mulai.slice(0, 5),
      waktu_selesai: jadwal.waktu_selesai.slice(0, 5),
      jenis_pelajaran: jadwal.jenis_pelajaran,
      pengajar: jadwal.pengajar,
      lokasi: jadwal.lokasi,
      kelompok: jadwal.kelompok
    });

    setErrorMessage('');
    setModalOpen(true);
  }

  // =====================================
  // SIMPAN DATA (INSERT / UPDATE)
  // =====================================

  async function handleSimpan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErrorMessage('');

    if (
      !form.jenis_pelajaran.trim() ||
      !form.pengajar.trim() ||
      !form.lokasi.trim()
    ) {
      setErrorMessage('Semua kolom wajib diisi.');
      return;
    }

    if (form.waktu_selesai <= form.waktu_mulai) {
      setErrorMessage('Waktu selesai harus lebih besar dari waktu mulai.');
      return;
    }

    setSaving(true);

    const payload = {
      hari: form.hari,
      waktu_mulai: form.waktu_mulai,
      waktu_selesai: form.waktu_selesai,
      jenis_pelajaran: form.jenis_pelajaran.trim(),
      pengajar: form.pengajar.trim(),
      lokasi: form.lokasi.trim(),
      kelompok: form.kelompok
    };

    let error;

    if (editingId) {
      const result = await supabase
        .from('jadwal_mengaji')
        .update(payload)
        .eq('id', editingId);

      error = result.error;
    } else {
      const result = await supabase
        .from('jadwal_mengaji')
        .insert([payload]);

      error = result.error;
    }

    if (error) {
      console.error(error);
      setErrorMessage(error.message || 'Gagal menyimpan jadwal.');
      setSaving(false);
      return;
    }

    setSaving(false);
    setModalOpen(false);
    setForm(formAwal);
    setEditingId(null);

    await fetchJadwal();
  }

  // =====================================
  // HAPUS DATA
  // =====================================

  async function handleHapus(id: string, nama: string) {
    const yakin = window.confirm(
      `Apakah Anda yakin ingin menghapus jadwal ${nama}?`
    );

    if (!yakin) return;

    const { error } = await supabase
      .from('jadwal_mengaji')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      alert('Gagal menghapus jadwal: ' + error.message);
      return;
    }

    setJadwalList(prev => prev.filter(item => item.id !== id));
  }

  // =====================================
  // FILTER DATA
  // =====================================

  const filteredData = jadwalList.filter(item => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      item.jenis_pelajaran.toLowerCase().includes(query) ||
      item.pengajar.toLowerCase().includes(query) ||
      item.lokasi.toLowerCase().includes(query) ||
      item.hari.toLowerCase().includes(query);

    const matchesKelompok =
      filterKelompok === 'Semua' ||
      item.kelompok === filterKelompok;

    return matchesSearch && matchesKelompok;
  });

  // =====================================
  // TAMPILAN
  // =====================================

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Jadwal Mengaji
              </h1>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Pesantren
              </span>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Kelola jadwal kegiatan mengaji santri putra dan putri.
            </p>
          </div>

          <button
            onClick={handleTambah}
            className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition"
          >
            <Plus size={18} />
            Tambah Jadwal
          </button>
        </div>

        {/* STATISTIK */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              <CalendarDays size={23} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total Jadwal
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {jadwalList.length}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              <Users size={23} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Jadwal Putra
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {jadwalList.filter(x => x.kelompok === 'Putra').length}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
              <Users size={23} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Jadwal Putri
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {jadwalList.filter(x => x.kelompok === 'Putri').length}
              </h3>
            </div>
          </div>

        </div>

        {/* FILTER DAN PENCARIAN */}

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">

          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Cari pelajaran, pengajar, lokasi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={filterKelompok}
            onChange={e => setFilterKelompok(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua">Semua Kelompok</option>
            <option value="Putra">Putra</option>
            <option value="Putri">Putri</option>
          </select>

        </div>

        {/* TABEL JADWAL */}

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">

          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Daftar Jadwal Mengaji
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Total {filteredData.length} jadwal ditemukan
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left border-collapse">

              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/60 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-5 py-4">Hari</th>
                  <th className="px-5 py-4">Waktu</th>
                  <th className="px-5 py-4">Kitab / Pelajaran</th>
                  <th className="px-5 py-4">Pengajar</th>
                  <th className="px-5 py-4">Lokasi</th>
                  <th className="px-5 py-4">Kelompok</th>
                  <th className="px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">

                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      <Loader2 className="animate-spin inline mr-2" size={18} />
                      Memuat jadwal...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
                      Belum ada jadwal mengaji ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredData.map(item => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition"
                    >

                      <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {item.hari}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Clock size={15} className="text-emerald-600" />
                          {item.waktu_mulai.slice(0, 5)} - {item.waktu_selesai.slice(0, 5)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <BookOpen size={17} className="text-purple-600 shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {item.jenis_pelajaran}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <UserRound size={15} className="text-gray-400" />
                          {item.pengajar}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MapPin size={15} className="text-gray-400" />
                          {item.lokasi}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          item.kelompok === 'Putra'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        }`}>
                          {item.kelompok}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center items-center gap-2">

                          <button
                            title="Edit Jadwal"
                            onClick={() => handleEdit(item)}
                            className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            title="Hapus Jadwal"
                            onClick={() => handleHapus(item.id, item.jenis_pelajaran)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                          >
                            <Trash2 size={17} />
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

      </div>

      {/* =================================
          MODAL TAMBAH DAN EDIT
      ================================= */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">

            {/* HEADER MODAL */}

            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">

              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingId ? 'Edit Jadwal Mengaji' : 'Tambah Jadwal Mengaji'}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Lengkapi informasi kegiatan mengaji santri.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}

            <form onSubmit={handleSimpan} className="p-5 space-y-4">

              {errorMessage && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm p-3 rounded-lg">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* HARI */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Hari
                  </label>

                  <select
                    required
                    value={form.hari}
                    onChange={e => setForm({ ...form, hari: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {daftarHari.map(hari => (
                      <option key={hari} value={hari}>
                        {hari}
                      </option>
                    ))}
                  </select>
                </div>

                {/* KELOMPOK */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Kelompok Santri
                  </label>

                  <select
                    required
                    value={form.kelompok}
                    onChange={e => setForm({
                      ...form,
                      kelompok: e.target.value as 'Putra' | 'Putri'
                    })}
                    className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Putra">Putra</option>
                    <option value="Putri">Putri</option>
                  </select>
                </div>

                {/* WAKTU MULAI */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Waktu Mulai
                  </label>

                  <input
                    type="time"
                    required
                    value={form.waktu_mulai}
                    onChange={e => setForm({ ...form, waktu_mulai: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* WAKTU SELESAI */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Waktu Selesai
                  </label>

                  <input
                    type="time"
                    required
                    value={form.waktu_selesai}
                    onChange={e => setForm({ ...form, waktu_selesai: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* PELAJARAN */}

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Jenis Kitab / Pelajaran
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="Contoh: Fathul Qorib, Tajwid, Nahwu..."
                    value={form.jenis_pelajaran}
                    onChange={e => setForm({ ...form, jenis_pelajaran: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* PENGAJAR */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Pengajar
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="Nama ustaz / ustazah"
                    value={form.pengajar}
                    onChange={e => setForm({ ...form, pengajar: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* LOKASI */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Lokasi
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="Contoh: Masjid, Aula, Kobong A"
                    value={form.lokasi}
                    onChange={e => setForm({ ...form, lokasi: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

              </div>

              {/* FOOTER MODAL */}

              <div className="flex justify-end gap-3 pt-5 border-t border-gray-200 dark:border-gray-700">

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      {editingId ? 'Simpan Perubahan' : 'Simpan Jadwal'}
                    </>
                  )}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
