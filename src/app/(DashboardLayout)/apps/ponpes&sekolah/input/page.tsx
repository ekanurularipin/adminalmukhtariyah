'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Home, BookOpen, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function TambahKobongKelasPage() {
  const [loadingKobong, setLoadingKobong] = useState(false);
  const [loadingKelas, setLoadingKelas] = useState(false);

  const [namaKobong, setNamaKobong] = useState('');
  const [namaKelas, setNamaKelas] = useState('');

  const [kobongList, setKobongList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  async function fetchMasterData() {
    // Ambil data kobong & kelas dari database (jika Anda membuat tabel terpisah, 
    // atau mengambil data unik dari tabel santri & pendidikan_santri)
    const { data: santriData } = await supabase.from('santri').select('kobong');
    if (santriData) {
      const uniqueKobong = Array.from(new Set(santriData.map(item => item.kobong))).filter(Boolean);
      setKobongList(uniqueKobong);
    }

    const { data: pendData } = await supabase.from('pendidikan_santri').select('kelas');
    if (pendData) {
      const uniqueKelas = Array.from(new Set(pendData.map(item => item.kelas))).filter(Boolean);
      setKelasList(uniqueKelas);
    }
  }

  // Handle Tambah Kobong
  const handleAddKobong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKobong.trim()) return;
    setLoadingKobong(true);

    // Contoh implementasi jika disimpan ke tabel master 'kobong' atau langsung memberi feedback sukses
    alert(`Kobong "${namaKobong}" berhasil ditambahkan ke daftar pilihan!`);
    setKobongList(prev => [...prev, namaKobong]);
    setNamaKobong('');
    setLoadingKobong(false);
  };

  // Handle Tambah Kelas
  const handleAddKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKelas.trim()) return;
    setLoadingKelas(true);

    alert(`Kelas "${namaKelas}" berhasil ditambahkan ke daftar pilihan!`);
    setKelasList(prev => [...prev, namaKelas]);
    setNamaKelas('');
    setLoadingKelas(false);
  };

  return (
    <div className="p-6 font-sans transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kelola Kobong & Kelas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tambah data master kamar (kobong) dan tingkat kelas pendidikan.</p>
          </div>
          <Link
            href="/apps/ponpes/data-santri"
            className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium px-4 py-2.5 rounded-lg transition"
          >
            <ArrowLeft size={16} />
            Kembali ke Data Santri
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
                <p className="text-xs text-gray-500">Tambah asrama atau kamar santri baru.</p>
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
              <button
                type="submit"
                disabled={loadingKobong}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                <Plus size={18} />
                {loadingKobong ? 'Menyimpan...' : 'Tambah Kobong Baru'}
              </button>
            </form>

            {/* List Kobong Terdaftar */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Kobong Aktif Saat Ini:</h3>
              <div className="flex flex-wrap gap-2">
                {kobongList.map((kobong, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-xs font-medium">
                    {kobong}
                  </span>
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

            {/* List Kelas Terdaftar */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Kelas Aktif Saat Ini:</h3>
              <div className="flex flex-wrap gap-2">
                {kelasList.map((kelas, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-xs font-medium">
                    {kelas}
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