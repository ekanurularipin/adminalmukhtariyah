'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Plus, 
  Printer, 
  Search, 
  Calendar, 
  UserCheck, 
  Phone, 
  Trash2, 
  X, 
  FileText,
  CheckCircle2,
  Clock
} from 'lucide-react';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function IzinPulangPage() {
  const [izinList, setIzinList] = useState<any[]>([]);
  const [santriList, setSantriList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    nomor_surat: '',
    santri_id: '',
    keperluan: '',
    dijemput_oleh: '',
    kontak_wali: '',
    tanggal_berangkat: new Date().toISOString().split('T')[0],
    wajib_kembali: '',
    status_kembali: 'Sedang Pulang'
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Fungsi Generator Nomor Surat Otomatis
  const generateNomorSurat = (totalDataSaatIni: number) => {
    const now = new Date();
    const romawiBulan = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const bulan = romawiBulan[now.getMonth()];
    const tahun = now.getFullYear();
    const urut = String(totalDataSaatIni + 1).padStart(3, '0');
    return `${urut}/SIP-ALM/${bulan}/${tahun}`;
  };

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Ambil Data Izin Pulang
      const { data: dataIzin, error: izinError } = await supabase
        .from('izin_pulang')
        .select(`
          *,
          santri (
            nis,
            nama_santri,
            kobong,
            wali
          )
        `)
        .order('id', { ascending: false });

      if (izinError) throw izinError;
      setIzinList(dataIzin || []);

      // 2. Ambil Data Santri (Hanya Pesantren Saja & Pesantren & Sekolah)
      const { data: dataSantri } = await supabase
        .from('santri')
        .select(`
          id,
          nis,
          nama_santri,
          wali,
          pendidikan_santri (
            jenis_pendidikan
          )
        `)
        .order('nama_santri', { ascending: true });

      const filteredSantri = (dataSantri || []).filter((s: any) => {
        const prog = s.pendidikan_santri?.[0]?.jenis_pendidikan;
        return prog === 'Pesantren Saja' || prog === 'Pesantren & Sekolah';
      });
      setSantriList(filteredSantri);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Buka Modal Tambah & Generate Nomor Surat Otomatis
  const handleOpenModal = () => {
    const autoNoSurat = generateNomorSurat(izinList.length);
    setFormData({
      nomor_surat: autoNoSurat,
      santri_id: '',
      keperluan: '',
      dijemput_oleh: '',
      kontak_wali: '',
      tanggal_berangkat: new Date().toISOString().split('T')[0],
      wajib_kembali: '',
      status_kembali: 'Sedang Pulang'
    });
    setShowModal(true);
  };

  // Auto-fill nama wali saat santri dipilih
  const handleSantriChange = (santriId: string) => {
    const selected = santriList.find((s) => String(s.id) === santriId);
    setFormData((prev) => ({
      ...prev,
      santri_id: santriId,
      dijemput_oleh: selected?.wali ? `${selected.wali} (Orang Tua/Wali)` : ''
    }));
  };

  // Simpan Data Izin Pulang
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.santri_id) {
      alert('Pilih santri terlebih dahulu!');
      return;
    }
    setSaving(true);

    try {
      const { error } = await supabase.from('izin_pulang').insert([{
        nomor_surat: formData.nomor_surat,
        santri_id: Number(formData.santri_id),
        keperluan: formData.keperluan.trim(),
        dijemput_oleh: formData.dijemput_oleh.trim(),
        kontak_wali: formData.kontak_wali.trim(),
        tanggal_berangkat: formData.tanggal_berangkat,
        wajib_kembali: formData.wajib_kembali,
        status_kembali: formData.status_kembali
      }]);

      if (error) throw error;

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert('Gagal menyimpan izin pulang: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Update Status Kembali
  const handleStatusChange = async (id: number, newStatus: string) => {
    const { error } = await supabase
      .from('izin_pulang')
      .update({ status_kembali: newStatus })
      .eq('id', id);

    if (!error) {
      setIzinList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status_kembali: newStatus } : item))
      );
    }
  };

  // Hapus Data
  const handleDelete = async (id: number, noSurat: string) => {
    if (window.confirm(`Hapus data surat izin ${noSurat}?`)) {
      await supabase.from('izin_pulang').delete().eq('id', id);
      fetchData();
    }
  };

  // Filter Pencarian
  const filteredList = izinList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.nomor_surat?.toLowerCase().includes(q) ||
      item.santri?.nama_santri?.toLowerCase().includes(q) ||
      item.keperluan?.toLowerCase().includes(q) ||
      item.dijemput_oleh?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 font-sans transition-colors duration-200 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Perizinan Pulang Santri</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pencatatan izin pulang santri dan penerbitan surat izin resmi pondok pesantren.
            </p>
          </div>

          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Plus size={18} />
            Buat Izin Pulang
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
              placeholder="Cari nomor surat, nama santri, atau keperluan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Total Surat Izin: <strong className="text-gray-900 dark:text-white">{filteredList.length}</strong>
          </div>
        </div>

        {/* Tabel Izin Pulang */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50">
                  <th className="py-3.5 px-6">No. Surat</th>
                  <th className="py-3.5 px-6">Nama Santri</th>
                  <th className="py-3.5 px-6">Keperluan</th>
                  <th className="py-3.5 px-6">Penjemput & Kontak</th>
                  <th className="py-3.5 px-6">Jadwal Pulang & Kembali</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">Memuat data perizinan...</td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">Belum ada data izin pulang terdaftar.</td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        {item.nomor_surat}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900 dark:text-white">{item.santri?.nama_santri || '-'}</div>
                        <div className="text-xs text-gray-400">Kobong: {item.santri?.kobong || '-'}</div>
                      </td>
                      <td className="py-4 px-6 text-gray-600 dark:text-gray-300 max-w-xs">
                        {item.keperluan}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-800 dark:text-gray-200">{item.dijemput_oleh}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone size={12} className="text-emerald-600" />
                          {item.kontak_wali}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs space-y-1">
                        <div>
                          <span className="text-gray-400">Berangkat:</span>{' '}
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {new Date(item.tanggal_berangkat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Wajib Kembali:</span>{' '}
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            {new Date(item.wajib_kembali).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={item.status_kembali}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className={`text-xs font-medium rounded-lg px-2.5 py-1.5 border focus:outline-none cursor-pointer ${
                            item.status_kembali === 'Sudah Kembali'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : item.status_kembali === 'Terlambat'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          <option value="Sedang Pulang">Sedang Pulang</option>
                          <option value="Sudah Kembali">Sudah Kembali</option>
                          <option value="Terlambat">Terlambat</option>
                        </select>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/apps/ponpes/izin-pulang/cetak/${item.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-medium transition"
                          title="Cetak Surat Izin"
                        >
                          <Printer size={14} />
                          Cetak Surat
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.nomor_surat)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 transition"
                          title="Hapus Data"
                        >
                          <Trash2 size={16} />
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

      {/* MODAL: Tambah Izin Pulang */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText size={20} className="text-emerald-600" />
                Buat Surat Izin Pulang
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nomor Surat (Otomatis)
                </label>
                <input
                  type="text"
                  required
                  value={formData.nomor_surat}
                  onChange={(e) => setFormData({ ...formData, nomor_surat: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono font-semibold text-emerald-700 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Santri <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.santri_id}
                  onChange={(e) => handleSantriChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Pilih Santri --</option>
                  {santriList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama_santri} ({s.nis})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keperluan Pulang <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Menghadiri pernikahan kakak kandung / Kontrol kesehatan"
                  value={formData.keperluan}
                  onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dijemput Oleh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: H. Abdullah (Ayah)"
                    value={formData.dijemput_oleh}
                    onChange={(e) => setFormData({ ...formData, dijemput_oleh: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kontak Wali (No. HP/WA) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 08123456789"
                    value={formData.kontak_wali}
                    onChange={(e) => setFormData({ ...formData, kontak_wali: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tanggal Berangkat <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_berangkat}
                    onChange={(e) => setFormData({ ...formData, tanggal_berangkat: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Wajib Kembali <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.wajib_kembali}
                    onChange={(e) => setFormData({ ...formData, wajib_kembali: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan & Buat Surat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}