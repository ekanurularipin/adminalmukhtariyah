'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Phone, 
  BookOpen, 
  Award, 
  UserCheck, 
  X 
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Ustadz {
  id: number;
  nama_ustadz: string;
  gelar: string;
  no_wa: string;
  bidang_keilmuan: string;
  amanah_jabatan: string;
}

export default function DaftarUstadzPage() {
  const [ustadzList, setUstadzList] = useState<Ustadz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State Modal (Untuk Tambah & Edit sekaligus)
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nama_ustadz: '',
    gelar: '',
    no_wa: '',
    bidang_keilmuan: '',
    amanah_jabatan: ''
  });

  useEffect(() => {
    fetchUstadz();
  }, []);

  async function fetchUstadz() {
    setLoading(true);
    const { data, error } = await supabase
      .from('ustadz')
      .select('*')
      .order('nama_ustadz', { ascending: true });

    if (error) {
      console.error('Gagal mengambil data ustadz:', error);
    } else {
      setUstadzList(data || []);
    }
    setLoading(false);
  }

  // Buka Modal Mode Tambah
  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      nama_ustadz: '',
      gelar: '',
      no_wa: '',
      bidang_keilmuan: '',
      amanah_jabatan: ''
    });
    setShowModal(true);
  };

  // Buka Modal Mode Edit
  const handleOpenEdit = (item: Ustadz) => {
    setEditId(item.id);
    setFormData({
      nama_ustadz: item.nama_ustadz || '',
      gelar: item.gelar || '',
      no_wa: item.no_wa || '',
      bidang_keilmuan: item.bidang_keilmuan || '',
      amanah_jabatan: item.amanah_jabatan || ''
    });
    setShowModal(true);
  };

  // Simpan Data (Insert jika baru, Update jika edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_ustadz.trim()) return;
    setSaving(true);

    try {
      if (editId) {
        // Mode Edit
        const { error } = await supabase
          .from('ustadz')
          .update({
            nama_ustadz: formData.nama_ustadz.trim(),
            gelar: formData.gelar.trim(),
            no_wa: formData.no_wa.trim(),
            bidang_keilmuan: formData.bidang_keilmuan.trim(),
            amanah_jabatan: formData.amanah_jabatan.trim()
          })
          .eq('id', editId);

        if (error) throw error;
      } else {
        // Mode Tambah
        const { error } = await supabase
          .from('ustadz')
          .insert([{
            nama_ustadz: formData.nama_ustadz.trim(),
            gelar: formData.gelar.trim(),
            no_wa: formData.no_wa.trim(),
            bidang_keilmuan: formData.bidang_keilmuan.trim(),
            amanah_jabatan: formData.amanah_jabatan.trim()
          }]);

        if (error) throw error;
      }

      setShowModal(false);
      fetchUstadz();
    } catch (err: any) {
      alert('Gagal menyimpan data: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Hapus Data Ustadz
  const handleDelete = async (id: number, nama: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data ${nama}?`)) {
      const { error } = await supabase.from('ustadz').delete().eq('id', id);
      if (error) {
        alert('Gagal menghapus data: ' + error.message);
      } else {
        setUstadzList((prev) => prev.filter((u) => u.id !== id));
      }
    }
  };

  // Filter Pencarian
  const filteredUstadz = ustadzList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.nama_ustadz?.toLowerCase().includes(q) ||
      item.bidang_keilmuan?.toLowerCase().includes(q) ||
      item.amanah_jabatan?.toLowerCase().includes(q)
    );
  });

  // Helper untuk format link WhatsApp
  const formatWaLink = (wa: string) => {
    if (!wa) return '#';
    let cleaned = wa.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }
    return `https://wa.me/${cleaned}`;
  };

  return (
    <div className="p-6 font-sans transition-colors duration-200 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daftar Ustadz & Pengajar</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manajemen data asatidz, bidang keilmuan, dan amanah jabatan di pesantren.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Plus size={18} />
            Tambah Ustadz / Pengajar
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Cari nama ustadz, keilmuan, atau jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Total Pengajar: <span className="font-bold text-gray-900 dark:text-white">{filteredUstadz.length}</span> orang
          </div>
        </div>

        {/* Card Grid Layout (1 Data = 1 Card) */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Memuat data ustadz & pengajar...</div>
        ) : filteredUstadz.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-400">
            Belum ada data ustadz/pengajar yang ditemukan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUstadz.map((ustadz) => (
              <div
                key={ustadz.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                {/* Bagian Atas Card: Nama, Gelar & Badge Jabatan */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-base shrink-0">
                        {ustadz.nama_ustadz.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                          {ustadz.nama_ustadz}
                          {ustadz.gelar ? `, ${ustadz.gelar}` : ''}
                        </h3>
                        <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Award size={12} />
                          {ustadz.amanah_jabatan || 'Pengajar'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detail Informasi */}
                  <div className="pt-2 space-y-2 text-sm border-t border-gray-100 dark:border-gray-700/80">
                    <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                      <BookOpen size={16} className="text-emerald-600 shrink-0" />
                      <span className="text-xs">
                        Keilmuan: <strong className="font-semibold text-gray-900 dark:text-gray-100">{ustadz.bidang_keilmuan || '-'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                      <Phone size={16} className="text-emerald-600 shrink-0" />
                      {ustadz.no_wa ? (
                        <a
                          href={formatWaLink(ustadz.no_wa)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          {ustadz.no_wa} (Chat WA)
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">Nomor WA belum diisi</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi di Bawah Card (Edit & Hapus) */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => handleOpenEdit(ustadz)}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-50 dark:bg-gray-900 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-gray-700 dark:text-gray-200 hover:text-amber-700 dark:hover:text-amber-300 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 transition"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(ustadz.id, ustadz.nama_ustadz)}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-50 dark:bg-gray-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-gray-700 dark:text-gray-200 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 transition"
                  >
                    <Trash2 size={14} />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* MODAL: Tambah / Edit Ustadz */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserCheck size={20} className="text-emerald-600" />
                {editId ? 'Edit Data Ustadz / Pengajar' : 'Tambah Ustadz / Pengajar'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nama Ustadz / Pengajar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ust. Ahmad Fauzi"
                    value={formData.nama_ustadz}
                    onChange={(e) => setFormData({ ...formData, nama_ustadz: e.target.value })}
                    // className="w-full px-4 py-2.5"
                    className="w-full px-4  bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gelar
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Lc., M.Ag."
                    value={formData.gelar}
                    onChange={(e) => setFormData({ ...formData, gelar: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={formData.no_wa}
                  onChange={(e) => setFormData({ ...formData, no_wa: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bidang Keilmuan / Mapel
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Fiqih, Nahwu Shorof, Tahfidz Al-Qur'an"
                  value={formData.bidang_keilmuan}
                  onChange={(e) => setFormData({ ...formData, bidang_keilmuan: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amanah / Jabatan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Mudir Ma'had, Wali Kelas, Pembina Asrama"
                  value={formData.amanah_jabatan}
                  onChange={(e) => setFormData({ ...formData, amanah_jabatan: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}