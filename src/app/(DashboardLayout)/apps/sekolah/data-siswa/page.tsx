'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Search,
  Eye,
  UserPlus,
  Pencil,
  Trash2,
  BookOpen,
  X,
  QrCode,
  Download,
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

const getQrUrl = (value: string, size = 96) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;

export default function DataSiswaPage() {
  const [santriList, setSantriList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterJk, setFilterJk] = useState<string>('Semua');
  const [filterKobong, setFilterKobong] = useState<string>('Semua Kobong');
  const [filterKelas, setFilterKelas] = useState<string>('Semua Kelas');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [downloadingNis, setDownloadingNis] = useState<string | null>(null);

  // State Opsi Master Data dari Tabel Supabase
  const [listKobongMaster, setListKobongMaster] = useState<any[]>([]);
  const [listKelasMaster, setListKelasMaster] = useState<any[]>([]);

  // State Modal Aksi
  const [selectedSantri, setSelectedSantri] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showKobongModal, setShowKobongModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  // Form State untuk Edit Lengkap
  const [editKobongVal, setEditKobongVal] = useState<string>('');
  const [editForm, setEditForm] = useState({
    nis: '',
    nama_santri: '',
    jk: 'Putra',
    kobong: '',
    wali: '',
    status: 'Aktif',
    jenis_pendidikan: '',
    kelas: '',
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      // 1. Ambil Master Data Kobong
      const { data: kobongData } = await supabase.from('kobong').select('*').order('nama_kobong');
      setListKobongMaster(kobongData || []);

      // 2. Ambil Master Data Kelas
      const { data: kelasData } = await supabase.from('kelas').select('*').order('nama_kelas');
      setListKelasMaster(kelasData || []);

      // 3. Ambil Data Santri & Pendidikan Santri
      const { data: santriData, error } = await supabase
        .from('santri')
        .select(`
          *,
          pendidikan_santri (
            id,
            jenis_pendidikan,
            kelas
          )
        `)
        .order('nis', { ascending: true });

      if (error) throw error;

      // Filter khusus siswa ('Sekolah Saja' atau 'Pesantren & Sekolah')
      const filtered = (santriData || []).filter((item: any) => {
        const pend = Array.isArray(item.pendidikan_santri)
          ? item.pendidikan_santri[0]
          : item.pendidikan_santri;
        const prog = pend?.jenis_pendidikan;
        return prog === 'Sekolah Saja' || prog === 'Pesantren & Sekolah';
      });

      setSantriList(filtered);
    } catch (err) {
      console.error('Gagal memuat data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Download QR berdasarkan angka NISN
  const handleDownloadQr = async (nis: string, namaSantri?: string) => {
    const cleanNis = String(nis || '').trim();
    if (!cleanNis) return;

    setDownloadingNis(cleanNis);
    try {
      const highResUrl = getQrUrl(cleanNis, 300);
      const response = await fetch(highResUrl);
      if (!response.ok) {
        throw new Error('Gagal mengunduh gambar QR');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const safeName = String(namaSantri || 'siswa')
        .trim()
        .replace(/[^a-zA-Z0-9-_]+/g, '_');

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `QR-NIS-${cleanNis}-${safeName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      console.error('Gagal mengunduh QR NIS:', err);
      alert('Gagal mengunduh QR NIS. Silakan coba lagi.');
    } finally {
      setDownloadingNis(null);
    }
  };

  // 1. Aksi: Lihat Detail
  const handleOpenDetail = (santri: any) => {
    setSelectedSantri(santri);
    setShowDetailModal(true);
  };

  // 2. Aksi: Atur Kobong
  const handleOpenKobong = (santri: any) => {
    setSelectedSantri(santri);
    setEditKobongVal(santri.kobong || '');
    setShowKobongModal(true);
  };

  const handleSaveKobong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) return;
    setSaving(true);

    const { error } = await supabase
      .from('santri')
      .update({ kobong: editKobongVal })
      .eq('id', selectedSantri.id);

    if (error) {
      alert('Gagal memperbarui kobong: ' + error.message);
    } else {
      setShowKobongModal(false);
      fetchAllData();
    }
    setSaving(false);
  };

  // 3. Aksi: Edit Data Lengkap (Santri & Pendidikan Santri)
  const handleOpenEdit = (santri: any) => {
    setSelectedSantri(santri);
    const pend = Array.isArray(santri.pendidikan_santri)
      ? santri.pendidikan_santri[0]
      : santri.pendidikan_santri;

    setEditForm({
      nis: santri.nis || '',
      nama_santri: santri.nama_santri || '',
      jk: santri.jk || 'Putra',
      kobong: santri.kobong || '',
      wali: santri.wali || '',
      status: santri.status || 'Aktif',
      jenis_pendidikan: pend?.jenis_pendidikan || 'Pesantren & Sekolah',
      kelas: pend?.kelas || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) return;
    setSaving(true);

    try {
      const { error: santriErr } = await supabase
        .from('santri')
        .update({
          nis: editForm.nis,
          nama_santri: editForm.nama_santri,
          jk: editForm.jk,
          kobong: editForm.kobong,
          wali: editForm.wali,
          status: editForm.status,
        })
        .eq('id', selectedSantri.id);

      if (santriErr) throw santriErr;

      const pendId = selectedSantri.pendidikan_santri?.[0]?.id;
      if (pendId) {
        const { error: pendErr } = await supabase
          .from('pendidikan_santri')
          .update({
            jenis_pendidikan: editForm.jenis_pendidikan,
            kelas: editForm.kelas,
          })
          .eq('id', pendId);

        if (pendErr) throw pendErr;
      }

      setShowEditModal(false);
      fetchAllData();
    } catch (err: any) {
      alert('Gagal menyimpan perubahan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 4. Aksi: Hapus Siswa
  async function handleDelete(id: number, nama: string) {
    if (window.confirm(`Hapus data siswa atas nama ${nama}?`)) {
      const { error } = await supabase.from('santri').delete().eq('id', id);
      if (error) {
        alert('Gagal menghapus data: ' + error.message);
      } else {
        setSantriList(santriList.filter((item) => item.id !== id));
      }
    }
  }

  // Filter Data
  const filteredData = santriList.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.nama_santri?.toLowerCase().includes(q) ||
      item.nis?.toLowerCase().includes(q) ||
      String(item.nis || '').toLowerCase().includes(q) ||
      item.wali?.toLowerCase().includes(q);

    const matchesJk = filterJk === 'Semua' || item.jk === filterJk;
    const matchesKobong = filterKobong === 'Semua Kobong' || item.kobong === filterKobong;

    const pend = Array.isArray(item.pendidikan_santri)
      ? item.pendidikan_santri[0]
      : item.pendidikan_santri;
    const kelasSantri = String(pend?.kelas || '').trim();
    const matchesKelas =
      filterKelas === 'Semua Kelas' || kelasSantri.toLowerCase() === filterKelas.toLowerCase();

    return matchesSearch && matchesJk && matchesKobong && matchesKelas;
  });

  return (
    <div className="p-6 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Siswa</h1>
              <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                Khusus Siswa
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Daftar Siswa Yang Terdaftar di Al-Mukhtariyah.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="relative w-full lg:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Cari nama, NIS, NISN, atau wali..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Filter Jenis Kelamin */}
            <div className="bg-gray-100 dark:bg-gray-900 p-1 rounded-lg flex items-center space-x-1 text-sm w-full sm:w-auto justify-center">
              {['Semua', 'Putra', 'Putri'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterJk(tab)}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md font-medium transition ${
                    filterJk === tab
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Filter Kobong dari Tabel Master Kobong */}
            <div className="relative w-full sm:w-auto">
              <select
                value={filterKobong}
                onChange={(e) => setFilterKobong(e.target.value)}
                className="appearance-none w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Semua Kobong">Semua Kobong</option>
                {listKobongMaster.map((k) => (
                  <option key={k.id} value={k.nama_kobong}>
                    {k.nama_kobong}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Kelas dari Tabel Master Kelas */}
            <div className="relative w-full sm:w-auto">
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="appearance-none w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Semua Kelas">Semua Kelas</option>
                {listKelasMaster.map((kls) => (
                  <option key={kls.id} value={kls.nama_kelas}>
                    Kelas {kls.nama_kelas}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50">
                  <th className="py-3.5 px-6">NIS</th>
                  <th className="py-3.5 px-6">Nama Siswa</th>
                  <th className="py-3.5 px-6">JK</th>
                  <th className="py-3.5 px-6">Program</th>
                  <th className="py-3.5 px-6">Kelas</th>
                  <th className="py-3.5 px-6">Kobong</th>
                  <th className="py-3.5 px-6">Wali</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-center">QR</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-gray-400">
                      Memuat data dari Supabase...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-gray-400">
                      Tidak ada data siswa yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((santri) => {
                    const pend = Array.isArray(santri.pendidikan_santri)
                      ? santri.pendidikan_santri[0]
                      : santri.pendidikan_santri;
                    const nisValue = String(santri.nis ?? '').trim();
                    const isDownloading = downloadingNis === nisValue;

                    return (
                      <tr
                        key={santri.id}
                        className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition"
                      >
                        <td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">
                          {santri.nis}
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-900 dark:text-gray-100">
                          {santri.nama_santri}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              santri.jk === 'Putra'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {santri.jk}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <BookOpen size={12} />
                            {pend?.jenis_pendidikan || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                          {pend?.kelas || '-'}
                        </td>
                        <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                          {santri.kobong || '-'}
                        </td>
                        <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                          {santri.wali || '-'}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {santri.status || 'Aktif'}
                          </span>
                        </td>

                        {/* Kolom QR Berisi Angka NISN + Tombol Download */}
                        <td className="py-3 px-6 text-center">
                          {nisValue ? (
                            <div className="inline-flex flex-col items-center gap-1.5">
                              <img
                                src={getQrUrl(nisValue, 96)}
                                alt={`QR NIS ${nisValue}`}
                                title={`NIS: ${nisValue}`}
                                className="w-12 h-12 rounded-md bg-white p-1 border border-gray-200 dark:border-gray-700"
                              />
                              <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                                {nisValue}
                              </span>
                              <button
                                type="button"
                                disabled={isDownloading}
                                onClick={() => handleDownloadQr(nisValue, santri.nama_santri)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition disabled:opacity-50 cursor-pointer"
                              >
                                <Download size={12} />
                                {isDownloading ? 'Unduh...' : 'Download'}
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                              <QrCode size={14} />
                              -
                            </span>
                          )}
                        </td>

                        {/* Tombol Aksi */}
                        <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenDetail(santri)}
                            title="Lihat Detail"
                            className="text-gray-400 hover:text-emerald-600 transition"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenKobong(santri)}
                            title="Atur Kobong"
                            className="text-gray-400 hover:text-blue-600 transition"
                          >
                            <UserPlus size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(santri)}
                            title="Edit Siswa"
                            className="text-gray-400 hover:text-amber-600 transition"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(santri.id, santri.nama_santri)}
                            title="Hapus Siswa"
                            className="text-gray-400 hover:text-red-600 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODAL EDIT LENGKAP (Santri & Pendidikan) --- */}
      {showEditModal && selectedSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Pencil size={20} className="text-emerald-600" />
                Edit Data Siswa &amp; Pendidikan
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    NIS
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.nis}
                    onChange={(e) => setEditForm({ ...editForm, nis: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nama Siswa
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.nama_santri}
                    onChange={(e) => setEditForm({ ...editForm, nama_santri: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={editForm.jk}
                    onChange={(e) => setEditForm({ ...editForm, jk: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="Putra">Putra</option>
                    <option value="Putri">Putri</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kobong (Asrama)
                  </label>
                  <select
                    value={editForm.kobong}
                    onChange={(e) => setEditForm({ ...editForm, kobong: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="">-- Pilih Kobong --</option>
                    {listKobongMaster.map((k) => (
                      <option key={k.id} value={k.nama_kobong}>
                        {k.nama_kobong}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Program Pendidikan
                  </label>
                  <select
                    value={editForm.jenis_pendidikan}
                    onChange={(e) =>
                      setEditForm({ ...editForm, jenis_pendidikan: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="Pesantren & Sekolah">Pesantren &amp; Sekolah</option>
                    <option value="Sekolah Saja">Sekolah Saja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kelas (dari Master Kelas)
                  </label>
                  <select
                    value={editForm.kelas}
                    onChange={(e) => setEditForm({ ...editForm, kelas: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {listKelasMaster.map((kls) => (
                      <option key={kls.id} value={kls.nama_kelas}>
                        {kls.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nama Wali
                  </label>
                  <input
                    type="text"
                    value={editForm.wali}
                    onChange={(e) => setEditForm({ ...editForm, wali: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Boyong">Boyong</option>
                    <option value="Cuti">Cuti</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DETAIL & MODAL ATUR KOBONG --- */}
      {showDetailModal && selectedSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Eye size={20} className="text-emerald-600" />
                Detail Data Siswa
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                <span className="text-gray-500">NIS:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedSantri.nis}
                </span>
              </div>
             
              <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                <span className="text-gray-500">Nama Lengkap:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedSantri.nama_santri}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                <span className="text-gray-500">Jenis Kelamin:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedSantri.jk}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                <span className="text-gray-500">Kelas:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedSantri.pendidikan_santri?.[0]?.kelas || '-'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                <span className="text-gray-500">Asrama / Kobong:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedSantri.kobong || 'Belum diatur'}
                </span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-gray-500">Nama Wali:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedSantri.wali || '-'}
                </span>
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              {selectedSantri.nis && (
                <button
                  type="button"
                  onClick={() => handleDownloadQr(selectedSantri.nis, selectedSantri.nama_santri)}
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg inline-flex items-center justify-center gap-1.5"
                >
                  <Download size={15} />
                  Download QR
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showKobongModal && selectedSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus size={20} className="text-emerald-600" />
                Atur Kobong Siswa
              </h3>
              <button
                onClick={() => setShowKobongModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveKobong} className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  Siswa:{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {selectedSantri.nama_santri}
                  </strong>
                </p>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pilih Kobong
                </label>
                <select
                  value={editKobongVal}
                  onChange={(e) => setEditKobongVal(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="">-- Pilih Kobong --</option>
                  {listKobongMaster.map((k) => (
                    <option key={k.id} value={k.nama_kobong}>
                      {k.nama_kobong}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKobongModal(false)}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}