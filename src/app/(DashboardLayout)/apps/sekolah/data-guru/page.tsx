'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Phone, 
  Mail, 
  BookOpen, 
  Award, 
  UserCheck, 
  X
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Guru {
  id: number;
  nama_guru: string;
  nip: string;
  mata_pelajaran: string;
  tugas_tambahan: string;
  alamat: string;
  email: string;
  password: string;
  no_hp: string;
}

export default function DataGuruMtsPage() {
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [listMapelMaster, setListMapelMaster] = useState<any[]>([]);
  const [listKelasMaster, setListKelasMaster] = useState<any[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State Modal (Tambah & Edit)
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nama_guru: '',
    nip: '',
    mata_pelajaran: '',
    tugas_kategori: 'Guru Mata Pelajaran', // Pilihan: 'Guru Mata Pelajaran', 'Wali Kelas', 'Kepala Sekolah', 'Wakil Kepala', dll
    pilihan_kelas_wali: '',                // Jika tugas kategori adalah 'Wali Kelas'
    tugas_tambahan_custom: '',             // Jika tugas kategori custom/lainnya
    alamat: '',
    email: '',
    password: '',
    no_hp: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Ambil Master Mata Pelajaran
      const { data: mapelData } = await supabase.from('mata_pelajaran').select('*').order('nama_mapel');
      setListMapelMaster(mapelData || []);

      // 2. Ambil Master Kelas (untuk opsi Wali Kelas)
      const { data: kelasData } = await supabase.from('kelas').select('*').order('nama_kelas');
      setListKelasMaster(kelasData || []);

      // 3. Ambil Data Guru MTs
      const { data: guruData, error } = await supabase
        .from('guru_mts')
        .select('*')
        .order('nama_guru', { ascending: true });

      if (error) throw error;
      setGuruList(guruData || []);
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Buka Modal Tambah
  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      nama_guru: '',
      nip: '',
      mata_pelajaran: listMapelMaster[0]?.nama_mapel || '',
      tugas_kategori: 'Guru Mata Pelajaran',
      pilihan_kelas_wali: listKelasMaster[0]?.nama_kelas || '',
      tugas_tambahan_custom: '',
      alamat: '',
      email: '',
      password: '',
      no_hp: ''
    });
    setShowModal(true);
  };

  // Buka Modal Edit
  const handleOpenEdit = (item: Guru) => {
    setEditId(item.id);

    // Cek apakah tugas tambahan mengandung kata 'Wali Kelas'
    let kategori = 'Lainnya';
    let kelasWali = '';
    let customTugas = item.tugas_tambahan || '';

    if (!item.tugas_tambahan || item.tugas_tambahan === 'Guru Mata Pelajaran') {
      kategori = 'Guru Mata Pelajaran';
    } else if (item.tugas_tambahan.toLowerCase().includes('wali kelas')) {
      kategori = 'Wali Kelas';
      // Ambil nama kelas dari string, misal "Wali Kelas 7 A" -> "7 A"
      kelasWali = item.tugas_tambahan.replace(/wali kelas/i, '').trim();
    } else {
      kategori = 'Lainnya';
      customTugas = item.tugas_tambahan;
    }

    setFormData({
      nama_guru: item.nama_guru || '',
      nip: item.nip || '',
      mata_pelajaran: item.mata_pelajaran || '',
      tugas_kategori: kategori,
      pilihan_kelas_wali: kelasWali || listKelasMaster[0]?.nama_kelas || '',
      tugas_tambahan_custom: customTugas,
      alamat: item.alamat || '',
      email: item.email || '',
      password: item.password || '',
      no_hp: item.no_hp || ''
    });
    setShowModal(true);
  };

  // Simpan Data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_guru.trim() || !formData.mata_pelajaran) {
      alert('Nama guru dan mata pelajaran wajib diisi!');
      return;
    }

    // Format final string tugas tambahan berdasarkan pilihan dropdown
    let finalTugasTambahan = formData.tugas_kategori;
    if (formData.tugas_kategori === 'Wali Kelas') {
      finalTugasTambahan = `Wali Kelas ${formData.pilihan_kelas_wali}`;
    } else if (formData.tugas_kategori === 'Lainnya') {
      finalTugasTambahan = formData.tugas_tambahan_custom;
    }

    setSaving(true);

    try {
      const payload = {
        nama_guru: formData.nama_guru.trim(),
        nip: formData.nip.trim(),
        mata_pelajaran: formData.mata_pelajaran,
        tugas_tambahan: finalTugasTambahan,
        alamat: formData.alamat.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        no_hp: formData.no_hp.trim()
      };

      if (editId) {
        const { error } = await supabase.from('guru_mts').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('guru_mts').insert([payload]);
        if (error) throw error;
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert('Gagal menyimpan data: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Hapus Data Guru
  const handleDelete = async (id: number, nama: string) => {
    if (window.confirm(`Hapus data guru atas nama ${nama}?`)) {
      const { error } = await supabase.from('guru_mts').delete().eq('id', id);
      if (error) {
        alert('Gagal menghapus data: ' + error.message);
      } else {
        setGuruList((prev) => prev.filter((g) => g.id !== id));
      }
    }
  };

  // Filter Pencarian
  const filteredGuru = guruList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.nama_guru?.toLowerCase().includes(q) ||
      item.nip?.toLowerCase().includes(q) ||
      item.mata_pelajaran?.toLowerCase().includes(q) ||
      item.tugas_tambahan?.toLowerCase().includes(q)
    );
  });

  const formatWaLink = (hp: string) => {
    if (!hp) return '#';
    let cleaned = hp.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
    return `https://wa.me/${cleaned}`;
  };

  return (
    <div className="p-6 font-sans transition-colors duration-200 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Guru MTs</h1>
              <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Madrasah Tsanawiyah
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manajemen data pendidik, mata pelajaran dari database, dan tugas tambahan wali kelas.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Plus size={18} />
            Tambah Guru MTs
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
              placeholder="Cari nama, NIP, mapel, atau tugas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="text-xs font-medium text-gray-500">
            Total Guru MTs: <span className="font-bold text-gray-900 dark:text-white">{filteredGuru.length}</span> orang
          </div>
        </div>

        {/* Card Grid Layout */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Memuat data guru MTs...</div>
        ) : filteredGuru.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-400">
            Belum ada data guru MTs yang terdaftar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuru.map((guru) => (
              <div
                key={guru.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-base shrink-0">
                        {guru.nama_guru.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                          {guru.nama_guru}
                        </h3>
                        <p className="text-xs font-mono text-gray-500">NIP: {guru.nip || '-'}</p>
                        {guru.tugas_tambahan && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Award size={12} />
                            {guru.tugas_tambahan}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2 text-sm border-t border-gray-100 dark:border-gray-700/80">
                    <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                      <BookOpen size={16} className="text-emerald-600 shrink-0" />
                      <span className="text-xs">
                        Mapel: <strong className="font-semibold text-gray-900 dark:text-gray-100">{guru.mata_pelajaran}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                      <Mail size={16} className="text-emerald-600 shrink-0" />
                      <span className="text-xs truncate">{guru.email || 'Email belum diisi'}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                      <Phone size={16} className="text-emerald-600 shrink-0" />
                      {guru.no_hp ? (
                        <a
                          href={formatWaLink(guru.no_hp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-emerald-700 hover:underline"
                        >
                          {guru.no_hp} (Chat WA)
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">Nomor HP belum diisi</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => handleOpenEdit(guru)}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-50 dark:bg-gray-900 hover:bg-amber-50 text-gray-700 dark:text-gray-200 hover:text-amber-700 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 transition"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(guru.id, guru.nama_guru)}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-50 dark:bg-gray-900 hover:bg-rose-50 text-gray-700 dark:text-gray-200 hover:text-rose-700 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 transition"
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* --- MODAL TAMBAH / EDIT --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserCheck size={20} className="text-emerald-600" />
                {editId ? 'Edit Data Guru MTs' : 'Tambah Guru MTs Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Lengkap &amp; Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Drs. H. Ahmad Fauzi, M.Pd."
                  value={formData.nama_guru}
                  onChange={(e) => setFormData({ ...formData, nama_guru: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NIP</label>
                  <input
                    type="text"
                    placeholder="Nomor Induk Pegawai"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nomor HP / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 081234567890"
                    value={formData.no_hp}
                    onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* MATA PELAJARAN DIAMBIL DARI DATABASE MASTER */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mata Pelajaran (Dari Database) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.mata_pelajaran}
                  onChange={(e) => setFormData({ ...formData, mata_pelajaran: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {listMapelMaster.map((mapel) => (
                    <option key={mapel.id} value={mapel.nama_mapel}>{mapel.nama_mapel}</option>
                  ))}
                </select>
              </div>

              {/* TUGAS TAMBAHAN & PILIHAN KELAS WALI DARI DATABASE KELAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tugas Tambahan
                  </label>
                  <select
                    value={formData.tugas_kategori}
                    onChange={(e) => setFormData({ ...formData, tugas_kategori: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="Guru Mata Pelajaran">Guru Mata Pelajaran</option>
                    <option value="Wali Kelas">Wali Kelas</option>
                    <option value="Pembina OSIS">Pembina OSIS</option>
                    <option value="Kepala Perpustakaan">Kepala Perpustakaan</option>
                    <option value="Lainnya">Lainnya (Custom)</option>
                  </select>
                </div>

                {/* Jika dipilih 'Wali Kelas', muncul dropdown pilihan kelas dari database tabel kelas */}
                {formData.tugas_kategori === 'Wali Kelas' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-emerald-600">
                      Pilih Kelas Binaan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.pilihan_kelas_wali}
                      onChange={(e) => setFormData({ ...formData, pilihan_kelas_wali: e.target.value })}
                      className="w-full px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 rounded-lg text-sm text-gray-900 dark:text-gray-100 font-semibold"
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {listKelasMaster.map((k) => (
                        <option key={k.id} value={k.nama_kelas}>Kelas {k.nama_kelas}</option>
                      ))}
                    </select>
                  </div>
                ) : formData.tugas_kategori === 'Lainnya' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tugas Lainnya
                    </label>
                    <input
                      type="text"
                      placeholder="Tulis tugas tambahan..."
                      value={formData.tugas_tambahan_custom}
                      onChange={(e) => setFormData({ ...formData, tugas_tambahan_custom: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Keterangan
                    </label>
                    <input
                      type="text"
                      disabled
                      value="-"
                      className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 rounded-lg text-sm text-gray-400"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Akun</label>
                  <input
                    type="email"
                    placeholder="contoh@guru.mts.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password Akun</label>
                  <input
                    type="text"
                    placeholder="Password login sistem"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  placeholder="Alamat tempat tinggal guru..."
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                />
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
                  {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Simpan Data Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}