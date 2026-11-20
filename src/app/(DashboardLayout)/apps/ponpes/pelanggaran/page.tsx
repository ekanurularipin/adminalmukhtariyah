'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Settings, AlertTriangle, CheckCircle2, Clock, Trash2, X, FileText } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function BukuPelanggaranPage() {
  const [loading, setLoading] = useState(false);
  const [catatanList, setCatatanList] = useState<any[]>([]);
  const [jenisList, setJenisList] = useState<any[]>([]);
  const [santriList, setSantriList] = useState<any[]>([]);

  // Modal States
  const [showModalCatat, setShowModalCatat] = useState(false);
  const [showModalJenis, setShowModalJenis] = useState(false);

  // Form Catat Pelanggaran
  const [formCatat, setFormCatat] = useState({
    santri_id: '',
    jenis_pelanggaran_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    sanksi_tazir: '',
    status_tazir: 'menjalani',
    pelapor: 'Pengurus Pesantren'
  });

  // Form Tambah Jenis Pelanggaran
  const [formJenis, setFormJenis] = useState({
    nama_pelanggaran: '',
    poin: 10
  });

  // Statistik Ringkasan
  const [stats, setStats] = useState({
    totalCatatan: 0,
    pekanIni: 0,
    totalPoin: 0,
    jenisTerdaftar: 0
  });

  useEffect(() => {
    fetchDataAll();
  }, []);

  async function fetchDataAll() {
    setLoading(true);
    try {
      // 1. Ambil Jenis Pelanggaran
      const { data: dataJenis } = await supabase.from('jenis_pelanggaran').select('*').order('nama_pelanggaran');
      if (dataJenis) setJenisList(dataJenis);

      // 2. Ambil Santri (Hanya Pesantren Saja & Pesantren & Sekolah)
      const { data: dataSantriRaw } = await supabase
        .from('santri')
        .select(`
          id,
          nis,
          nama_santri,
          pendidikan_santri (
            jenis_pendidikan
          )
        `)
        .order('nama_santri');

      const filteredSantri = (dataSantriRaw || []).filter((s: any) => {
        const prog = s.pendidikan_santri?.[0]?.jenis_pendidikan;
        return prog === 'Pesantren Saja' || prog === 'Pesantren & Sekolah';
      });
      setSantriList(filteredSantri);

      // 3. Ambil Catatan Pelanggaran
      const { data: dataCatatan } = await supabase
        .from('catatan_pelanggaran')
        .select(`
          *,
          santri ( nama_santri ),
          jenis_pelanggaran ( nama_pelanggaran, poin )
        `)
        .order('tanggal', { ascending: false });

      if (dataCatatan) {
        setCatatanList(dataCatatan);

        // Kalkulasi Statistik
        const total = dataCatatan.length;
        let sumPoin = 0;
        dataCatatan.forEach(item => {
          sumPoin += item.jenis_pelanggaran?.poin || 0;
        });

        setStats({
          totalCatatan: total,
          pekanIni: total > 0 ? Math.min(total, 2) : 0, // Contoh mock pekann ini atau hitung tanggal
          totalPoin: sumPoin,
          jenisTerdaftar: dataJenis?.length || 0
        });
      }

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Simpan Jenis Pelanggaran Baru
  const handleSaveJenis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJenis.nama_pelanggaran) return;

    const { error } = await supabase.from('jenis_pelanggaran').insert([formJenis]);
    if (error) {
      alert('Gagal menambah jenis pelanggaran: ' + error.message);
    } else {
      setFormJenis({ nama_pelanggaran: '', poin: 10 });
      setShowModalJenis(false);
      fetchDataAll();
    }
  };

  // Handle Simpan Catatan Pelanggaran Santri
  const handleSaveCatat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCatat.santri_id || !formCatat.jenis_pelanggaran_id) {
      alert('Pilih santri dan jenis pelanggaran terlebih dahulu!');
      return;
    }

    const { error } = await supabase.from('catatan_pelanggaran').insert([{
      santri_id: Number(formCatat.santri_id),
      jenis_pelanggaran_id: Number(formCatat.jenis_pelanggaran_id),
      tanggal: formCatat.tanggal,
      sanksi_tazir: formCatat.sanksi_tazir,
      status_tazir: formCatat.status_tazir,
      pelapor: formCatat.pelapor
    }]);

    if (error) {
      alert('Gagal mencatat pelanggaran: ' + error.message);
    } else {
      setFormCatat({
        santri_id: '',
        jenis_pelanggaran_id: '',
        tanggal: new Date().toISOString().split('T')[0],
        sanksi_tazir: '',
        status_tazir: 'menjalani',
        pelapor: 'Pengurus Pesantren'
      });
      setShowModalCatat(false);
      fetchDataAll();
    }
  };

  // Handle Update Status Ta'zir Langsung dari Tabel
  const handleStatusChange = async (id: number, newStatus: string) => {
    const { error } = await supabase
      .from('catatan_pelanggaran')
      .update({ status_tazir: newStatus })
      .eq('id', id);

    if (!error) {
      setCatatanList(prev => prev.map(item => item.id === id ? { ...item, status_tazir: newStatus } : item));
    }
  };

  return (
    <div className="p-6 font-sans transition-colors duration-200 space-y-6">
      
      {/* Header & Aksi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Buku Pelanggaran & Ta'zir</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Catat pelanggaran santri dan kelola jenis pelanggarannya.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModalJenis(true)}
            className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition"
          >
            <Settings size={16} />
            Kelola Jenis
          </button>
          
          <button
            onClick={() => setShowModalCatat(true)}
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition"
          >
            <Plus size={18} />
            Catat Pelanggaran
          </button>
        </div>
      </div>

      {/* Kartu Statistik Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">TOTAL CATATAN</p>
          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.totalCatatan}</h3>
        </div>

        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">PEKAN INI</p>
          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.pekanIni}</h3>
        </div>

        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">TOTAL POIN TERTIMBUN</p>
          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.totalPoin}</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">JENIS TERDAFTAR</p>
          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.jenisTerdaftar}</h3>
        </div>
      </div>

      {/* Tabel Catatan Pelanggaran */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50">
                <th className="py-3.5 px-6">Tanggal</th>
                <th className="py-3.5 px-6">Santri</th>
                <th className="py-3.5 px-6">Jenis & Poin</th>
                <th className="py-3.5 px-6">Sanksi Ta'zir</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Pelapor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">Memuat data pelanggaran...</td>
                </tr>
              ) : catatanList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">Belum ada catatan pelanggaran yang tercatat.</td>
                </tr>
              ) : (
                catatanList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition">
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300 font-medium">
                      {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">{item.santri?.nama_santri || '-'}</td>
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-2">
                        <span className="text-gray-800 dark:text-gray-200">{item.jenis_pelanggaran?.nama_pelanggaran}</span>
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 px-2 py-0.5 rounded-full text-xs font-bold">
                          {item.jenis_pelanggaran?.poin || 0} poin
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{item.sanksi_tazir}</td>
                    <td className="py-4 px-6">
                      <select
                        value={item.status_tazir}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
                      >
                        <option value="menjalani">Menjalani Ta'zir</option>
                        <option value="selesai">Selesai Ta'zir</option>
                        <option value="peringatan SP1">Peringatan SP1</option>
                        <option value="peringatan SP2">Peringatan SP2</option>
                        <option value="peringatan SP3">Peringatan SP3</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400 text-xs">{item.pelapor || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah Jenis Pelanggaran */}
      {showModalJenis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tambah Jenis Pelanggaran</h3>
              <button onClick={() => setShowModalJenis(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveJenis} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Pelanggaran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Keluar Tanpa Izin"
                  value={formJenis.nama_pelanggaran}
                  onChange={(e) => setFormJenis({ ...formJenis, nama_pelanggaran: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah Poin</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formJenis.poin}
                  onChange={(e) => setFormJenis({ ...formJenis, poin: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowModalJenis(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Catat Pelanggaran Santri */}
      {showModalCatat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Catat Pelanggaran Santri</h3>
              <button onClick={() => setShowModalCatat(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveCatat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pilih Santri (Pesantren / Pesantren & Sekolah)</label>
                <select
                  required
                  value={formCatat.santri_id}
                  onChange={(e) => setFormCatat({ ...formCatat, santri_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Pilih Santri --</option>
                  {santriList.map((s) => (
                    <option key={s.id} value={s.id}>{s.nama_santri} ({s.nis})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenis Pelanggaran</label>
                <select
                  required
                  value={formCatat.jenis_pelanggaran_id}
                  onChange={(e) => setFormCatat({ ...formCatat, jenis_pelanggaran_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Pilih Jenis Pelanggaran --</option>
                  {jenisList.map((j) => (
                    <option key={j.id} value={j.id}>{j.nama_pelanggaran} ({j.poin} Poin)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formCatat.tanggal}
                    onChange={(e) => setFormCatat({ ...formCatat, tanggal: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status Ta'zir</label>
                  <select
                    value={formCatat.status_tazir}
                    onChange={(e) => setFormCatat({ ...formCatat, status_tazir: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="menjalani">Menjalani</option>
                    <option value="selesai">Selesai</option>
                    <option value="peringatan SP1">Peringatan SP1</option>
                    <option value="peringatan SP2">Peringatan SP2</option>
                    <option value="peringatan SP3">Peringatan SP3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sanksi Ta'zir</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bersihkan aula putri 2 hari / Baca Al-Waqiah 10x"
                  value={formCatat.sanksi_tazir}
                  onChange={(e) => setFormCatat({ ...formCatat, sanksi_tazir: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Pelapor / Ustaz</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ust. Dedi Supriatna"
                  value={formCatat.pelapor}
                  onChange={(e) => setFormCatat({ ...formCatat, pelapor: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowModalCatat(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg">Simpan Catatan</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}