'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Home, BookOpen, Plus, Trash2, ArrowLeft, Users, UserCheck } from 'lucide-react';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function TambahKobongKelasPage() {
  const [loadingKobong, setLoadingKobong] = useState(false);
  const [loadingKelas, setLoadingKelas] = useState(false);

  // Form State Kobong
  const [namaKobong, setNamaKobong] = useState('');
  const [kapasitas, setKapasitas] = useState<number | ''>(15);
  const [pembina, setPembina] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState('Putra');

  // Form State Kelas
  const [namaKelas, setNamaKelas] = useState('');

  const [kobongList, setKobongList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  async function fetchMasterData() {
    const { data: dataKobong } = await supabase.from('kobong').select('*').order('nama_kobong', { ascending: true });
    if (dataKobong) setKobongList(dataKobong);

    const { data: dataKelas } = await supabase.from('kelas').select('*').order('nama_kelas', { ascending: true });
    if (dataKelas) setKelasList(dataKelas);
  }

  // Handle Tambah Kobong ke Database
  const handleAddKobong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKobong.trim()) return;
    setLoadingKobong(true);

    const { error } = await supabase.from('kobong').insert([{ 
      nama_kobong: namaKobong.trim(),
      kapasitas_maksimal: Number(kapasitas) || 10,
      pembina: pembina.trim() || '-',
      jenis_kelamin: jenisKelamin
    }]);

    if (error) {
      alert('Gagal menambah kobong: ' + error.message);
    } else {
      setNamaKobong('');
      setKapasitas(15);
      setPembina('');
      setJenisKelamin('Putra');
      fetchMasterData();
    }
    setLoadingKobong(false);
  };

  // Handle Tambah Kelas ke Database
  const handleAddKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKelas.trim()) return;
    setLoadingKelas(true);

    const { error } = await supabase.from('kelas').insert([{ nama_kelas: namaKelas.trim() }]);

    if (error) {
      alert('Gagal menambah kelas: ' + error.message);
    } else {
      setNamaKelas('');
      fetchMasterData();
    }
    setLoadingKelas(false);
  };

  // Handle Hapus Kobong
  const handleDeleteKobong = async (id: number, nama: string) => {
    if (window.confirm(`Hapus kobong ${nama}?`)) {
      await supabase.from('kobong').delete().eq('id', id);
      fetchMasterData();
    }
  };

  // Handle Hapus Kelas
  const handleDeleteKelas = async (id: number, nama: string) => {
    if (window.confirm(`Hapus kelas ${nama}?`)) {
      await supabase.from('kelas').delete().eq('id', id);
      fetchMasterData();
    }
  };

  return (
    <div className="p-6 font-sans transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kelola Kobong & Kelas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Atur asrama, kapasitas, pembina, jenis kelamin, dan kelas pendidikan.</p>
          </div>
          <Link
            href="/apps/ponpes/data-santri"
            className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium px-4 py-2.5 rounded-lg transition"
          >
            <ArrowLeft size={16} />
            Kembali
          </Link>
        </div>

        {/* Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SECTION: Tambah Kobong */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
                <Home size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manajemen Kobong</h2>
                <p className="text-xs text-gray-500">Atur asrama, pembina, dan kuota kamar.</p>
              </div>
            </div>

            <form onSubmit={handleAddKobong} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Kobong / Asrama</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Al-Mubarok"
                  value={namaKobong}
                  onChange={(e) => setNamaKobong(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kapasitas</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Users size={16} />
                    </span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={kapasitas}
                      onChange={(e) => setKapasitas(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenis Kobong</label>
                  <select
                    value={jenisKelamin}
                    onChange={(e) => setJenisKelamin(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Putra">Putra</option>
                    <option value="Putri">Putri</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Pembina / Lurah Asrama</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <UserCheck size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Contoh: Ustadz Ahmad"
                    value={pembina}
                    onChange={(e) => setPembina(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingKobong}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                <Plus size={18} />
                {loadingKobong ? 'Menyimpan...' : 'Tambah Kobong Baru'}
              </button>
            </form>

            {/* List Kobong Database */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Daftar Kobong Terdaftar:</h3>
              <div className="flex flex-col gap-2">
                {kobongList.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{item.nama_kobong}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          item.jenis_kelamin === 'Putra' 
                            ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' 
                            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}>
                          {item.jenis_kelamin || 'Putra'}
                        </span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        Pembina: <span className="font-medium text-gray-700 dark:text-gray-300">{item.pembina || '-'}</span> | Max: {item.kapasitas_maksimal} santri
                      </p>
                    </div>
                    <button onClick={() => handleDeleteKobong(item.id, item.nama_kobong)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION: Tambah Kelas */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-lg">
                <BookOpen size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manajemen Kelas</h2>
                <p className="text-xs text-gray-500">Tambah tingkat kelas sekolah atau diniyah.</p>
              </div>
            </div>

            <form onSubmit={handleAddKelas} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama / Tingkat Kelas</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kelas 10 / Diniyah Wustha"
                  value={namaKelas}
                  onChange={(e) => setNamaKelas(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={loadingKelas}
                className="w-full inline-flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                <Plus size={18} />
                {loadingKelas ? 'Menyimpan...' : 'Tambah Kelas Baru'}
              </button>
            </form>

            {/* List Kelas Database */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Daftar Kelas di Database:</h3>
              <div className="flex flex-wrap gap-2">
                {kelasList.map((item) => (
                  <span key={item.id} className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium">
                    {item.nama_kelas}
                    <button onClick={() => handleDeleteKelas(item.id, item.nama_kelas)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}