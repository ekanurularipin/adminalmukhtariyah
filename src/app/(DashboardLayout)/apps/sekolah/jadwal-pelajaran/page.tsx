'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Calendar, 
  Clock, 
  BookOpen, 
  User,
  X 
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Jadwal {
  id: number;
  hari: string;
  mata_pelajaran: string;
  kelas: string;
  nama_guru: string;
  jam_mulai: string;
  jam_berakhir: string;
}

export default function JadwalPelajaranPage() {
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [listKelasMaster, setListKelasMaster] = useState<any[]>([]);
  const [listMapelMaster, setListMapelMaster] = useState<any[]>([]);
  const [listGuruMaster, setListGuruMaster] = useState<any[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterHari, setFilterHari] = useState<string>('Semua');

  // State Modal (Tambah & Edit)
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    hari: 'Senin',
    mata_pelajaran: '',
    kelas: '',
    nama_guru: '',
    jam_mulai: '07:30',
    jam_berakhir: '09:00'
  });

  const daftarHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Ambil Master Kelas
      const { data: kelasData } = await supabase.from('kelas').select('*').order('nama_kelas');
      setListKelasMaster(kelasData || []);

      // 2. Ambil Master Mata Pelajaran
      const { data: mapelData } = await supabase.from('mata_pelajaran').select('*').order('nama_mapel');
      setListMapelMaster(mapelData || []);

      // 3. Ambil Data Guru MTs
      const { data: guruData } = await supabase.from('guru_mts').select('*').order('nama_guru');
      setListGuruMaster(guruData || []);

      // 4. Ambil Data Jadwal Pelajaran
      const { data: jadwalData, error } = await supabase
        .from('jadwal_pelajaran')
        .select('*')
        .order('hari', { ascending: true })
        .order('jam_mulai', { ascending: true });

      if (error) throw error;
      setJadwalList(jadwalData || []);
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Jika guru dipilih, otomatis set mapel bawaan guru tersebut (tapi tetap bisa diubah manual)
  const handleGuruChange = (namaGuru: string) => {
    const selectedGuru = listGuruMaster.find((g) => g.nama_guru === namaGuru);
    setFormData((prev) => ({
      ...prev,
      nama_guru: namaGuru,
      mata_pelajaran: selectedGuru ? selectedGuru.mata_pelajaran : prev.mata_pelajaran
    }));
  };

  // Hitung durasi jam pelajaran
  const hitungTotalJam = (mulai: string, selesai: string) => {
    if (!mulai || !selesai) return '-';
    const [hMulai, mMulai] = mulai.split(':').map(Number);
    const [hSelesai, mSelesai] = selesai.split(':').map(Number);

    const totalMenitMulai = hMulai * 60 + mMulai;
    const totalMenitSelesai = hSelesai * 60 + mSelesai;

    let selisihMenit = totalMenitSelesai - totalMenitMulai;
    if (selisihMenit < 0) return 'Format waktu salah';

    const jam = Math.floor(selisihMenit / 60);
    const menit = selisihMenit % 60;

    let hasil = '';
    if (jam > 0) hasil += `${jam} Jam `;
    if (menit > 0) hasil += `${menit} Menit`;
    return hasil.trim() || '0 Menit';
  };

  // Buka Modal Tambah
  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      hari: 'Senin',
      mata_pelajaran: listMapelMaster[0]?.nama_mapel || '',
      kelas: listKelasMaster[0]?.nama_kelas || '',
      nama_guru: listGuruMaster[0]?.nama_guru || '',
      jam_mulai: '07:30',
      jam_berakhir: '09:00'
    });
    setShowModal(true);
  };

  // Buka Modal Edit
  const handleOpenEdit = (item: Jadwal) => {
    setEditId(item.id);
    setFormData({
      hari: item.hari || 'Senin',
      mata_pelajaran: item.mata_pelajaran || '',
      kelas: item.kelas || '',
      nama_guru: item.nama_guru || '',
      jam_mulai: item.jam_mulai ? item.jam_mulai.slice(0, 5) : '07:30',
      jam_berakhir: item.jam_berakhir ? item.jam_berakhir.slice(0, 5) : '09:00'
    });
    setShowModal(true);
  };

  // Simpan Data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mata_pelajaran || !formData.kelas || !formData.nama_guru) {
      alert('Kelas, mata pelajaran, dan guru pengampu wajib dipilih!');
      return;
    }
    setSaving(true);

    try {
      const payload = {
        hari: formData.hari,
        mata_pelajaran: formData.mata_pelajaran,
        kelas: formData.kelas,
        nama_guru: formData.nama_guru,
        jam_mulai: formData.jam_mulai,
        jam_berakhir: formData.jam_berakhir
      };

      if (editId) {
        const { error } = await supabase.from('jadwal_pelajaran').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('jadwal_pelajaran').insert([payload]);
        if (error) throw error;
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert('Gagal menyimpan jadwal: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Hapus Jadwal
  const handleDelete = async (id: number, mapel: string, kelas: string) => {
    if (window.confirm(`Hapus jadwal ${mapel} untuk Kelas ${kelas}?`)) {
      const { error } = await supabase.from('jadwal_pelajaran').delete().eq('id', id);
      if (error) {
        alert('Gagal menghapus data: ' + error.message);
      } else {
        setJadwalList((prev) => prev.filter((j) => j.id !== id));
      }
    }
  };

  // Filter Data
  const filteredJadwal = jadwalList.filter((item) => {
    const matchesHari = filterHari === 'Semua' || item.hari === filterHari;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      item.mata_pelajaran?.toLowerCase().includes(q) ||
      item.kelas?.toLowerCase().includes(q) ||
      item.nama_guru?.toLowerCase().includes(q) ||
      item.hari?.toLowerCase().includes(q);

    return matchesHari && matchesSearch;
  });

  return (
    <div className="p-6 font-sans transition-colors duration-200 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jadwal Pelajaran Sekolah</h1>
              <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Madrasah Tsanawiyah
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pengaturan jadwal kegiatan belajar mengajar lengkap dengan guru pengampu.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Plus size={18} />
            Tambah Jadwal Baru
          </button>
        </div>

        {/* Filter Hari & Search Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="relative w-full lg:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Cari mapel, kelas, atau guru..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-1">
            <button
              onClick={() => setFilterHari('Semua')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterHari === 'Semua' ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
              }`}
            >
              Semua Hari
            </button>
            {daftarHari.map((hari) => (
              <button
                key={hari}
                onClick={() => setFilterHari(hari)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterHari === hari ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                }`}
              >
                {hari}
              </button>
            ))}
          </div>
        </div>

        {/* Tabel Jadwal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50">
                  <th className="py-3.5 px-6">Hari</th>
                  <th className="py-3.5 px-6">Kelas</th>
                  <th className="py-3.5 px-6">Mata Pelajaran</th>
                  <th className="py-3.5 px-6">Guru Pengampu</th>
                  <th className="py-3.5 px-6">Jam &amp; Durasi</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">Memuat data jadwal pelajaran...</td>
                  </tr>
                ) : filteredJadwal.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">Belum ada data jadwal pelajaran yang ditemukan.</td>
                  </tr>
                ) : (
                  filteredJadwal.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition">
                      <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <Calendar size={13} />
                          {item.hari}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-800 dark:text-gray-200">
                        Kelas {item.kelas}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BookOpen size={16} className="text-emerald-600 shrink-0" />
                        {item.mata_pelajaran}
                      </td>
                      <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <User size={14} className="text-emerald-600" />
                          {item.nama_guru || 'Belum ditentukan'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-mono text-xs text-gray-600 dark:text-gray-300">
                          {item.jam_mulai?.slice(0, 5)} - {item.jam_berakhir?.slice(0, 5)} WIB
                        </div>
                        <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                          ({hitungTotalJam(item.jam_mulai, item.jam_berakhir)})
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 hover:bg-amber-50 text-gray-700 dark:text-gray-200 hover:text-amber-700 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 transition"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.mata_pelajaran, item.kelas)}
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock size={20} className="text-emerald-600" />
                {editId ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hari <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.hari}
                  onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                >
                  {daftarHari.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {listKelasMaster.map((k) => (
                      <option key={k.id} value={k.nama_kelas}>Kelas {k.nama_kelas}</option>
                    ))}
                  </select>
                </div>

                {/* PILIH GURU PENGAMPU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Guru Pengampu <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.nama_guru}
                    onChange={(e) => handleGuruChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="">-- Pilih Guru --</option>
                    {listGuruMaster.map((g) => (
                      <option key={g.id} value={g.nama_guru}>{g.nama_guru}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* MATA PELAJARAN (Bisa otomatis dari guru, tapi tetap bisa diganti manual) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.mata_pelajaran}
                  onChange={(e) => setFormData({ ...formData, mata_pelajaran: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 font-semibold"
                >
                  <option value="">-- Pilih Mapel --</option>
                  {listMapelMaster.map((m) => (
                    <option key={m.id} value={m.nama_mapel}>{m.nama_mapel}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jam Mulai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.jam_mulai}
                    onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jam Berakhir <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.jam_berakhir}
                    onChange={(e) => setFormData({ ...formData, jam_berakhir: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
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
                  {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}