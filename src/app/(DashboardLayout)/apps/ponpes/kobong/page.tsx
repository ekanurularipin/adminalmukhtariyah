'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Package, Pencil, Plus, Users, Home, BedDouble, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface KobongItem {
  id: number;
  nama_kobong: string;
  lokasi?: string; // Kolom opsional untuk blok/lokasi asrama
  kapasitas_maksimal: number;
  pembina: string;
  jenis_kelamin: 'Putra' | 'Putri';
  jumlah_terisi?: number; // Dihitung otomatis dari tabel santri
}

export default function DataKobongPage() {
  const [kobongList, setKobongList] = useState<KobongItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Statistik Ringkasan
  const [stats, setStats] = useState({
    totalKobong: 0,
    totalKapasitas: 0,
    totalTerisi: 0,
    totalKosong: 0
  });

  useEffect(() => {
    fetchKobongAndOccupancy();
  }, []);

  async function fetchKobongAndOccupancy() {
    setLoading(true);
    try {
      // 1. Ambil data master kobong
      const { data: kobongData, error: kobongError } = await supabase
        .from('kobong')
        .select('*')
        .order('nama_kobong', { ascending: true });

      if (kobongError) throw kobongError;

      // 2. Ambil data santri untuk menghitung jumlah terisi per kobong
      const { data: santriData, error: santriError } = await supabase
        .from('santri')
        .select('kobong');

      if (santriError) throw santriError;

      // Hitung jumlah santri per nama kobong
      const occupancyMap: { [key: string]: number } = {};
      (santriData || []).forEach((s) => {
        if (s.kobong) {
          occupancyMap[s.kobong] = (occupancyMap[s.kobong] || 0) + 1;
        }
      });

      let sumKapasitas = 0;
      let sumTerisi = 0;

      // Gabungkan data kobong dengan jumlah terisi aktual
      const processedKobong = (kobongData || []).map((k) => {
        const terisi = occupancyMap[k.nama_kobong] || 0;
        sumKapasitas += k.kapasitas_maksimal || 0;
        sumTerisi += terisi;

        return {
          ...k,
          jumlah_terisi: terisi
        };
      });

      setKobongList(processedKobong);
      setStats({
        totalKobong: processedKobong.length,
        totalKapasitas: sumKapasitas,
        totalTerisi: sumTerisi,
        totalKosong: sumKapasitas - sumTerisi
      });

    } catch (err) {
      console.error('Gagal memuat data kobong:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 font-sans transition-colors duration-200 space-y-6">
      
      {/* Header & Tombol Tambah */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Kobong & Aset Asrama</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Monitoring kapasitas tempat tidur, okupansi santri, dan inventaris asrama.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/utilities/form"
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition"
          >
            <Plus size={18} />
            Kelola / Tambah Kobong
          </Link>
        </div>
      </div>

      {/* Statistik Cards di Atas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Total Kobong</p>
          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.totalKobong}</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Kapasitas Tempat Tidur</p>
          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.totalKapasitas}</h3>
        </div>

        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Terisi</p>
          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.totalTerisi}</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Tempat Tidur Kosong</p>
          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.totalKosong}</h3>
        </div>
      </div>

      {/* Grid Kartu Kobong */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat data asrama...</div>
      ) : kobongList.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          Belum ada data kobong. Silakan tambah melalui menu Kelola Kobong.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kobongList.map((kobong) => {
            const max = kobong.kapasitas_maksimal || 1;
            const terisi = kobong.jumlah_terisi || 0;
            const percentage = Math.min(Math.round((terisi / max) * 100), 100);

            return (
              <div 
                key={kobong.id} 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition"
              >
                {/* Baris Atas: Nama & Badge Putra/Putri */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{kobong.nama_kobong}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{kobong.lokasi || 'Komplek Asrama Pesantren'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    kobong.jenis_kelamin === 'Putra' 
                      ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' 
                      : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                  }`}>
                    {kobong.jenis_kelamin || 'Putra'}
                  </span>
                </div>

                {/* Okupansi & Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-300">
                    <span>Okupansi</span>
                    <span>{terisi}/{max} santri ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Nama Pembina */}
                <div className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                  Pembina: <span className="font-semibold text-gray-800 dark:text-gray-200">{kobong.pembina || 'Belum ditentukan'}</span>
                </div>

                {/* Tombol Aksi Bawah (Aset & Edit) */}
                <div className="grid grid-cols-5 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <Link 
                    href={`/apps/ponpes/aset-kobong?kobong_id=${kobong.id}`}
                    className="col-span-4 flex items-center justify-center gap-2 py-2 px-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 transition"
                  >
                    <Package size={14} className="text-emerald-600" />
                    Aset
                  </Link>
                  <Link 
                    href={`/apps/ponpes/aset-kobong`}
                    className="col-span-1 flex items-center justify-center py-2 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 transition"
                    title="Edit Kobong"
                  >
                    <Pencil size={14} />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}