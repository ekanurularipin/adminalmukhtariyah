'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, User, Hash, Home, BookOpen } from 'lucide-react';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function TambahSantriPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // State untuk menampung data master dari database
  const [kobongList, setKobongList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    nis: '',
    nama_santri: '',
    jk: 'Putra',
    jenis_pendidikan: 'Pesantren Saja',
    kelas: '', // Bisa dikosongkan jika tidak sekolah
    kobong: '', // Bisa dikosongkan jika tidak di pesantren
    wali: '',
    status: 'Aktif'
  });

  // Ambil data master kobong dan kelas saat komponen dimuat
  useEffect(() => {
    fetchMasterData();
  }, []);

  async function fetchMasterData() {
    try {
      const { data: dataKobong } = await supabase.from('kobong').select('*').order('nama_kobong', { ascending: true });
      if (dataKobong) setKobongList(dataKobong);

      const { data: dataKelas } = await supabase.from('kelas').select('*').order('nama_kelas', { ascending: true });
      if (dataKelas) setKelasList(dataKelas);
    } catch (err) {
      console.error('Gagal memuat master data:', err);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Masukkan data utama ke tabel 'santri'
      const { data: santriData, error: santriError } = await supabase
        .from('santri')
        .insert([{
          nis: formData.nis,
          nama_santri: formData.nama_santri,
          jk: formData.jk,
          kobong: formData.kobong || null, // Kosongkan jika tidak memilih kobong
          wali: formData.wali,
          status: formData.status
        }])
        .select()
        .single();

      if (santriError) throw santriError;

      // 2. Masukkan data program/pendidikan ke tabel 'pendidikan_santri'
      const { error: pendidikanError } = await supabase
        .from('pendidikan_santri')
        .insert([{
          santri_id: santriData.id,
          jenis_pendidikan: formData.jenis_pendidikan,
          kelas: formData.kelas || null, // Kosongkan jika tidak ada kelas
          tahun_ajaran: '2025/2026'
        }]);

      if (pendidikanError) throw pendidikanError;

      alert('Data berhasil disimpan!');
      router.push('/apps/ponpes/data-santri');
    } catch (error: any) {
      console.error('Error inserting data:', error);
      alert('Gagal menambahkan data: ' + (error.message || 'Terjadi kesalahan pada database'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 font-sans transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tambah Data Santri / Siswa</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pendaftaran baru beserta data pendidikannya.</p>
          </div>
          <Link
            href="/apps/ponpes/data-santri"
            className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium px-4 py-2.5 rounded-lg transition"
          >
            <ArrowLeft size={16} />
            Kembali
          </Link>
        </div>

        {/* Formulir */}
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* NIS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">NIS / Nomor Induk</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Hash size={18} /></span>
                  <input
                    type="text"
                    name="nis"
                    required
                    placeholder="Contoh: 26010025"
                    value={formData.nis}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><User size={18} /></span>
                  <input
                    type="text"
                    name="nama_santri"
                    required
                    placeholder="Contoh: Ahmad Fauzi"
                    value={formData.nama_santri}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jenis Kelamin</label>
                <select
                  name="jk"
                  value={formData.jk}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Putra">Putra</option>
                  <option value="Putri">Putri</option>
                </select>
              </div>

              {/* Program Pendidikan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Program Pendidikan</label>
                <select
                  name="jenis_pendidikan"
                  value={formData.jenis_pendidikan}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Pesantren Saja">Pesantren Saja</option>
                  <option value="Pesantren & Sekolah">Pesantren & Sekolah</option>
                  <option value="Sekolah Saja">Sekolah Saja</option>
                </select>
              </div>

              {/* Kelas (Bisa Dikosongkan) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kelas (Opsional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><BookOpen size={18} /></span>
                  <select
                    name="kelas"
                    value={formData.kelas}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Tidak Ada / Kosongkan --</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.nama_kelas}>
                        {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Penempatan Kobong (Bisa Dikosongkan) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Penempatan Kobong (Opsional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Home size={18} /></span>
                  <select
                    name="kobong"
                    value={formData.kobong}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Tidak Ada / Kosongkan --</option>
                    {kobongList.map((kob) => (
                      <option key={kob.id} value={kob.nama_kobong}>
                        {kob.nama_kobong} (Max: {kob.kapasitas_maksimal})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nama Wali */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Wali / Orang Tua</label>
                <input
                  type="text"
                  name="wali"
                  required
                  placeholder="Contoh: H. Abdullah"
                  value={formData.wali}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

            </div>

            {/* Tombol Simpan */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/apps/ponpes/data-santri"
                className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-6 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <Save size={18} />
                {loading ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}