'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Package, Plus, Trash2, ArrowLeft, Filter } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

function AsetKobongContent() {
  const searchParams = useSearchParams();
  const kobongIdParam = searchParams.get('kobong_id');

  const [loading, setLoading] = useState(false);
  const [kobongList, setKobongList] = useState<any[]>([]);
  const [asetList, setAsetList] = useState<any[]>([]);
  const [selectedFilterKobong, setSelectedFilterKobong] = useState<string>('Semua');

  const [formData, setFormData] = useState({
    kobong_id: kobongIdParam || '',
    nama_barang: '',
    jumlah: 1,
    kondisi: 'Baik'
  });

  useEffect(() => {
    fetchData();
  }, [kobongIdParam]);

  async function fetchData() {
    setLoading(true);
    // Ambil daftar kobong untuk dropdown
    const { data: kobongData } = await supabase.from('kobong').select('*').order('nama_kobong');
    if (kobongData) setKobongList(kobongData);

    // Ambil daftar aset
    let query = supabase
      .from('aset_kobong')
      .select(`
        *,
        kobong (
          id,
          nama_kobong
        )
      `)
      .order('id', { ascending: false });

    // Jika ada parameter kobong_id di URL, otomatis filter query-nya
    if (kobongIdParam) {
      query = query.eq('kobong_id', Number(kobongIdParam));
      setSelectedFilterKobong(kobongIdParam);
      setFormData(prev => ({ ...prev, kobong_id: kobongIdParam }));
    }

    const { data: asetData } = await query;
    if (asetData) setAsetList(asetData);
    setLoading(false);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kobong_id) {
      alert('Pilih kobong terlebih dahulu!');
      return;
    }
    setLoading(true);

    const { error } = await supabase.from('aset_kobong').insert([{
      kobong_id: Number(formData.kobong_id),
      nama_barang: formData.nama_barang,
      jumlah: Number(formData.jumlah),
      kondisi: formData.kondisi
    }]);

    if (error) {
      alert('Gagal menambah aset: ' + error.message);
    } else {
      setFormData({ 
        kobong_id: kobongIdParam || '', 
        nama_barang: '', 
        jumlah: 1, 
        kondisi: 'Baik' 
      });
      fetchData();
    }
    setLoading(false);
  };

  const handleDelete = async (id: number, nama: string) => {
    if (window.confirm(`Hapus aset "${nama}"?`)) {
      await supabase.from('aset_kobong').delete().eq('id', id);
      fetchData();
    }
  };

  // Filter tampilan berdasarkan dropdown pilihan user di halaman aset
  const filteredAsetList = selectedFilterKobong === 'Semua' 
    ? asetList 
    : asetList.filter(item => String(item.kobong_id) === String(selectedFilterKobong));

  return (
    <div className="p-6 font-sans transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Aset Kobong</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pendataan inventaris barang di setiap kamar asrama.</p>
          </div>
          <Link
            href="/apps/ponpes/kobong"
            className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium px-4 py-2.5 rounded-lg transition"
          >
            <ArrowLeft size={16} />
            Kembali ke Data Kobong
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form Tambah Aset */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4 h-fit">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package size={20} className="text-emerald-600" />
              Tambah Aset Baru
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pilih Kobong</label>
                <select
                  name="kobong_id"
                  required
                  value={formData.kobong_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Pilih Kobong --</option>
                  {kobongList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama_kobong}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Barang</label>
                <input
                  type="text"
                  name="nama_barang"
                  required
                  placeholder="Contoh: Kasur Busa / Kipas Angin"
                  value={formData.nama_barang}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah</label>
                <input
                  type="number"
                  name="jumlah"
                  required
                  min={1}
                  value={formData.jumlah}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kondisi</label>
                <select
                  name="kondisi"
                  value={formData.kondisi}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Baik">Baik</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                <Plus size={18} />
                {loading ? 'Menyimpan...' : 'Simpan Aset'}
              </button>
            </form>
          </div>

          {/* Tabel Daftar Aset */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            
            {/* Baris Filter & Judul Tabel */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                Daftar Inventaris Aset
              </span>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={selectedFilterKobong}
                  onChange={(e) => setSelectedFilterKobong(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Semua">Semua Kobong</option>
                  {kobongList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama_kobong}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-gray-900/50">
                    <th className="py-3 px-4">Kobong</th>
                    <th className="py-3 px-4">Nama Barang</th>
                    <th className="py-3 px-4">Jumlah</th>
                    <th className="py-3 px-4">Kondisi</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-200">
                  {filteredAsetList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400">Tidak ada data aset untuk kobong ini.</td>
                    </tr>
                  ) : (
                    filteredAsetList.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition">
                        <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                          {item.kobong?.nama_kobong || '-'}
                        </td>
                        <td className="py-3 px-4">{item.nama_barang}</td>
                        <td className="py-3 px-4">{item.jumlah}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            item.kondisi === 'Baik' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' 
                              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                          }`}>
                            {item.kondisi}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDelete(item.id, item.nama_barang)}
                            className="text-gray-400 hover:text-red-600 transition p-1"
                            title="Hapus Aset"
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

      </div>
    </div>
  );
}

export default function AsetKobongPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Memuat halaman aset...</div>}>
      <AsetKobongContent />
    </Suspense>
  );
}