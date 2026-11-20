'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  BookOpen, 
  X, 
  Tag 
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MataPelajaran {
  id: number;
  nama_mapel: string;
  kode_mapel: string;
  kategori: string;
}

export default function MataPelajaranPage() {
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterKategori, setFilterKategori] = useState<string>('Semua');

  // State Modal (Tambah & Edit)
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nama_mapel: '',
    kode_mapel: '',
    kategori: 'Agama'
  });

  const daftarKategori = ['Semua', 'Agama', 'Umum', 'Muatan Lokal'];

  useEffect(() => {
    fetchMapel();
  }, []);

  async function fetchMapel() {
    setLoading(true);
    const { data, error } = await supabase
      .from('mata_pelajaran')
      .select('*')
      .order('nama_mapel', { ascending: true });

    if (error) {
      console.error('Gagal mengambil data mapel:', error);
    } else {
      setMapelList(data || []);
    }
    setLoading(false);
  }

  // Buka Modal Tambah
  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      nama_mapel: '',
      kode_mapel: '',
      kategori: 'Agama'
    });
    setShowModal(true);
  };

  // Buka Modal Edit
  const handleOpenEdit = (item: MataPelajaran) => {
    setEditId(item.id);
    setFormData({
      nama_mapel: item.nama_mapel || '',
      kode_mapel: item.kode_mapel || '',
      kategori: item.kategori || 'Agama'
    });
    setShowModal(true);
  };

  // Simpan Data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_mapel.trim()) {
      alert('Nama mata pelajaran wajib diisi!');
      return;
    }
    setSaving(true);

    try {
      const payload = {
        nama_mapel: formData.nama_mapel.trim(),
        kode_mapel: formData.kode_mapel.trim().toUpperCase(),
        kategori: formData.kategori
      };

      if (editId) {
        const { error } = await supabase.from('mata_pelajaran').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('mata_pelajaran').insert([payload]);
        if (error) throw error;
      }

      setShowModal(false);
      fetchMapel();
    } catch (err: any) {
      alert('Gagal menyimpan mata pelajaran: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Hapus Data
  const handleDelete = async (id: number, nama: string) => {
    if (window.confirm(`Hapus mata pelajaran ${nama}?`)) {
      const { error } = await supabase.from('mata_pelajaran').delete().eq('id', id);
      if (error) {
        alert('Gagal menghapus data: ' + error.message);
      } else {
        setMapelList((prev) => prev.filter((m) => m.id !== id));
      }
    }
  };

  // Filter Data
  const filteredMapel = mapelList.filter((item) => {
    const matchesKategori = filterKategori === 'Semua' || item.kategori === filterKategori;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      item.nama_mapel?.toLowerCase().includes(q) ||
      item.kode_mapel?.toLowerCase().includes(q);

    return matchesKategori && matchesSearch;
  });

  return (
    <div className="p-6 font-sans transition-colors duration-200 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Master Mata Pelajaran</h1>
              <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Madrasah Tsanawiyah
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pengelolaan daftar mata pelajaran yang terintegrasi dengan data guru dan jadwal pelajaran.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Plus size={18} />
            Tambah Mata Pelajaran
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="relative w-full lg:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Cari nama atau kode mapel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
            {daftarKategori.map((kat) => (
              <button
                key={kat}
                onClick={() => setFilterKategori(kat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterKategori === kat ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                }`}
              >
                {kat}
              </button>
            ))}
          </div>
        </div>

        {/* Tabel Mata Pelajaran */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50">
                  <th className="py-3.5 px-6">Kode Mapel</th>
                  <th className="py-3.5 px-6">Nama Mata Pelajaran</th>
                  <th className="py-3.5 px-6">Kategori</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-400">Memuat data mata pelajaran...</td>
                  </tr>
                ) : filteredMapel.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-400">Belum ada data mata pelajaran yang ditemukan.</td>
                  </tr>
                ) : (
                  filteredMapel.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition">
                      <td className="py-4 px-6 font-mono font-semibold text-gray-900 dark:text-white">
                        {item.kode_mapel || '-'}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BookOpen size={16} className="text-emerald-600 shrink-0" />
                        {item.nama_mapel}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          <Tag size={12} />
                          {item.kategori}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 hover:bg-amber-50 text-gray-700 dark:text-gray-200 hover:text-amber-700 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 transition"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.nama_mapel)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 hover:bg-rose-50 text-gray-700 dark:text-gray-200 hover:text-rose-700 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 transition"
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* --- MODAL TAMBAH / EDIT --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen size={20} className="text-emerald-600" />
                {editId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Fiqih / Matematika"
                  value={formData.nama_mapel}
                  onChange={(e) => setFormData({ ...formData, nama_mapel: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kode Mapel (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: FIQ-01"
                  value={formData.kode_mapel}
                  onChange={(e) => setFormData({ ...formData, kode_mapel: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kategori <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="Agama">Agama / Keislaman</option>
                  <option value="Umum">Umum</option>
                  <option value="Muatan Lokal">Muatan Lokal</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Simpan Mapel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}