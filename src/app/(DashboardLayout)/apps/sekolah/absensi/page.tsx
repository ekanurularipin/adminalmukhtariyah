'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Calendar as CalendarIcon, 
  CheckCircle, 
  Save, 
  BookOpen, 
  User, 
  Clock,
  Layers,
  MessageSquareCode
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface SiswaAbsen {
  santri_id: number;
  nis: string;
  nama_santri: string;
  jk: string;
  wali: string;
  no_hp_wali: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
}

export default function AbsensiViaJadwalPage() {
  const [listJadwal, setListJadwal] = useState<any[]>([]);
  const [selectedJadwalId, setSelectedJadwalId] = useState<string>('');
  const [activeJadwal, setActiveJadwal] = useState<any>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [tanggal, setTanggal] = useState<string>(todayStr);

  const [absensiList, setAbsensiList] = useState<SiswaAbsen[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    fetchJadwalPelajaran();
  }, []);

  async function fetchJadwalPelajaran() {
    const { data, error } = await supabase
      .from('jadwal_pelajaran')
      .select('*')
      .order('hari', { ascending: true })
      .order('jam_mulai', { ascending: true });

    if (error) {
      console.error('Gagal memuat jadwal:', error);
    } else if (data && data.length > 0) {
      setListJadwal(data);
      setSelectedJadwalId(String(data[0].id));
      setActiveJadwal(data[0]);
    }
  }

  const handleJadwalChange = (idStr: string) => {
    setSelectedJadwalId(idStr);
    const found = listJadwal.find((j) => String(j.id) === idStr);
    if (found) {
      setActiveJadwal(found);
    }
  };

  useEffect(() => {
    if (activeJadwal && tanggal) {
      loadSiswaDanAbsensi();
    }
  }, [activeJadwal, tanggal]);

  async function loadSiswaDanAbsensi() {
    setLoading(true);
    setSuccessMsg('');
    try {
      const { data: siswaData, error: siswaErr } = await supabase
        .from('santri')
        .select(`
          id,
          nis,
          nama_santri,
          jk,
          wali,
          no_hp_wali,
          pendidikan_santri (
            kelas,
            jenis_pendidikan
          )
        `)
        .order('nama_santri', { ascending: true });

      if (siswaErr) throw siswaErr;

      const siswaKelas = (siswaData || []).filter((item: any) => {
        const pend = Array.isArray(item.pendidikan_santri) ? item.pendidikan_santri[0] : item.pendidikan_santri;
        const kelasSiswa = String(pend?.kelas || '').trim().toLowerCase();
        const targetKelas = String(activeJadwal.kelas || '').trim().toLowerCase();
        return kelasSiswa === targetKelas;
      });

      const { data: existingAbsensi } = await supabase
        .from('absensi')
        .select('id')
        .eq('tanggal', tanggal)
        .eq('kelas', activeJadwal.kelas)
        .eq('mata_pelajaran', activeJadwal.mata_pelajaran)
        .maybeSingle();

      if (existingAbsensi) {
        const { data: detailData } = await supabase
          .from('detail_absensi')
          .select('*')
          .eq('absensi_id', existingAbsensi.id);

        const mapped = siswaKelas.map((s: any) => {
          const found = detailData?.find((d: any) => d.santri_id === s.id);
          return {
            santri_id: s.id,
            nis: s.nis,
            nama_santri: s.nama_santri,
            jk: s.jk,
            wali: s.wali || 'Wali Siswa',
            no_hp_wali: s.no_hp_wali || '',
            status: found ? found.status : 'Hadir'
          };
        });
        setAbsensiList(mapped);
      } else {
        const mapped = siswaKelas.map((s: any) => ({
          santri_id: s.id,
          nis: s.nis,
          nama_santri: s.nama_santri,
          jk: s.jk,
          wali: s.wali || 'Wali Siswa',
          no_hp_wali: s.no_hp_wali || '',
          status: 'Hadir' as const
        }));
        setAbsensiList(mapped);
      }
    } catch (err) {
      console.error('Gagal memuat absensi:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = (santri_id: number, status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa') => {
    setAbsensiList((prev) =>
      prev.map((item) => (item.santri_id === santri_id ? { ...item, status } : item))
    );
  };

  const handleSetAll = (status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa') => {
    setAbsensiList((prev) => prev.map((item) => ({ ...item, status })));
  };

  // Kirim Pesan WhatsApp Tunggal ke Wali Siswa
  const handleSendSingleWA = (siswa: SiswaAbsen) => {
    if (!siswa.no_hp_wali) {
      const nomorInput = prompt(`Nomor HP Wali untuk siswa ${siswa.nama_santri} belum terdaftar.\nMasukkan Nomor WhatsApp Wali (contoh: 08123456789):`);
      if (!nomorInput) return;
      siswa.no_hp_wali = nomorInput;
    }

    let cleanedHp = siswa.no_hp_wali.replace(/\D/g, '');
    if (cleanedHp.startsWith('0')) {
      cleanedHp = '62' + cleanedHp.slice(1);
    }

    const pesan = `Assalamu'alaikum Wr. Wb.\n\nInformasi Akademik MTs Al-Mukhtariyah:\n\nKepada Yth. Bapak/Ibu Wali dari *${siswa.nama_santri}* (Kelas ${activeJadwal.kelas}).\n\nKami informasikan bahwa pada hari *${tanggal}* untuk mata pelajaran *${activeJadwal.mata_pelajaran}*, siswa yang bersangkutan tercatat berstatus: *${siswa.status.toUpperCase()}*.\n\nDemikian informasi ini kami sampaikan. Terima kasih.\n\n*Hormat Kami,\nGuru Pengampu (${activeJadwal.nama_guru})*`;

    const encodedMessage = encodeURIComponent(pesan);
    window.open(`https://wa.me/${cleanedHp}?text=${encodedMessage}`, '_blank');
  };

  const handleSaveAbsensi = async () => {
    if (!activeJadwal || absensiList.length === 0) {
      alert('Tidak ada jadwal atau siswa yang valid.');
      return;
    }
    setSaving(true);
    setSuccessMsg('');

    try {
      let absensiId: number;
      const { data: existingHeader } = await supabase
        .from('absensi')
        .select('id')
        .eq('tanggal', tanggal)
        .eq('kelas', activeJadwal.kelas)
        .eq('mata_pelajaran', activeJadwal.mata_pelajaran)
        .maybeSingle();

      if (existingHeader) {
        absensiId = existingHeader.id;
        await supabase.from('detail_absensi').delete().eq('absensi_id', absensiId);
        await supabase.from('absensi').update({ nama_guru: activeJadwal.nama_guru }).eq('id', absensiId);
      } else {
        const { data: newHeader, error: headerErr } = await supabase
          .from('absensi')
          .insert([{ 
            tanggal, 
            kelas: activeJadwal.kelas, 
            mata_pelajaran: activeJadwal.mata_pelajaran, 
            nama_guru: activeJadwal.nama_guru 
          }])
          .select('id')
          .single();

        if (headerErr) throw headerErr;
        absensiId = newHeader.id;
      }

      const detailPayload = absensiList.map((item) => ({
        absensi_id: absensiId,
        santri_id: item.santri_id,
        nis: item.nis,
        nama_santri: item.nama_santri,
        status: item.status
      }));

      const { error: detailErr } = await supabase.from('detail_absensi').insert(detailPayload);
      if (detailErr) throw detailErr;

      setSuccessMsg(`Absensi ${activeJadwal.mata_pelajaran} (Kelas ${activeJadwal.kelas}) berhasil disimpan!`);
    } catch (err: any) {
      alert('Gagal menyimpan absensi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalSiswa = absensiList.length;
  const jumlahHadir = absensiList.filter((i) => i.status === 'Hadir').length;
  const jumlahIzin = absensiList.filter((i) => i.status === 'Izin').length;
  const jumlahSakit = absensiList.filter((i) => i.status === 'Sakit').length;
  const jumlahAlpa = absensiList.filter((i) => i.status === 'Alpa').length;

  return (
    <div className="p-6 font-sans transition-colors duration-200 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Absensi &amp; Notifikasi WhatsApp Wali</h1>
              <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Madrasah Tsanawiyah
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Input absensi berdasarkan jadwal dan kirim pemberitahuan otomatis ke WhatsApp orang tua.
            </p>
          </div>

          <button
            onClick={handleSaveAbsensi}
            disabled={saving || absensiList.length === 0}
            className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Menyimpan...' : 'Simpan Absensi'}
          </button>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Panel Pemilihan Jadwal & Tanggal */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Layers size={14} className="text-emerald-600" /> Pilih Jadwal Mengajar
            </label>
            <select
              value={selectedJadwalId}
              onChange={(e) => handleJadwalChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 font-semibold"
            >
              {listJadwal.map((j) => (
                <option key={j.id} value={j.id}>
                  [{j.hari}] Kelas {j.kelas} - {j.mata_pelajaran} ({j.nama_guru}) | {j.jam_mulai?.slice(0, 5)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CalendarIcon size={14} className="text-emerald-600" /> Tanggal Mengajar
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 font-semibold"
            />
          </div>
        </div>

        {/* Info Jadwal */}
        {activeJadwal && (
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
                {activeJadwal.kelas}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen size={16} className="text-emerald-600" /> {activeJadwal.mata_pelajaran}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2 mt-0.5">
                  <User size={13} className="text-emerald-600" /> Pengampu: <span className="font-semibold">{activeJadwal.nama_guru}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-emerald-200">
              <Clock size={14} className="text-amber-600" />
              {activeJadwal.hari}, {activeJadwal.jam_mulai?.slice(0, 5)} - {activeJadwal.jam_berakhir?.slice(0, 5)} WIB
            </div>
          </div>
        )}

        {/* Statistik */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500">Total Siswa</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{totalSiswa}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 shadow-sm">
            <p className="text-xs text-emerald-700 font-medium">Hadir</p>
            <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">{jumlahHadir}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 shadow-sm">
            <p className="text-xs text-blue-700 font-medium">Izin</p>
            <p className="text-xl font-bold text-blue-800 dark:text-blue-300 mt-1">{jumlahIzin}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 shadow-sm">
            <p className="text-xs text-amber-700 font-medium">Sakit</p>
            <p className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-1">{jumlahSakit}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-rose-50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-200 shadow-sm">
            <p className="text-xs text-rose-700 font-medium">Alpa</p>
            <p className="text-xl font-bold text-rose-800 dark:text-rose-300 mt-1">{jumlahAlpa}</p>
          </div>
        </div>

        {/* Aksi Cepat */}
        {absensiList.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Aksi Cepat Kehadiran:</span>
            <div className="flex items-center gap-2">
              <button onClick={() => handleSetAll('Hadir')} className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg transition">Semua Hadir</button>
              <button onClick={() => handleSetAll('Izin')} className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-semibold rounded-lg transition">Semua Izin</button>
              <button onClick={() => handleSetAll('Sakit')} className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold rounded-lg transition">Semua Sakit</button>
              <button onClick={() => handleSetAll('Alpa')} className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold rounded-lg transition">Semua Alpa</button>
            </div>
          </div>
        )}

        {/* Tabel Absensi dengan Tombol WhatsApp */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50">
                  <th className="py-3.5 px-6 w-16">No</th>
                  <th className="py-3.5 px-6">NIS &amp; Nama Siswa</th>
                  <th className="py-3.5 px-6">Wali / No. HP</th>
                  <th className="py-3.5 px-6 text-center">Status Kehadiran</th>
                  <th className="py-3.5 px-6 text-right">Kirim Pesan WA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">Memuat data siswa...</td>
                  </tr>
                ) : absensiList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">Tidak ada siswa yang ditemukan di kelas ini.</td>
                  </tr>
                ) : (
                  absensiList.map((siswa, index) => (
                    <tr key={siswa.santri_id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition">
                      <td className="py-4 px-6 font-mono text-gray-500">{index + 1}</td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900 dark:text-white">{siswa.nama_santri}</div>
                        <div className="font-mono text-xs text-gray-500">NIS: {siswa.nis}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-800 dark:text-gray-200">{siswa.wali}</div>
                        <div className="font-mono text-xs text-emerald-600">{siswa.no_hp_wali || 'Belum ada No HP'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-1.5">
                          {(['Hadir', 'Izin', 'Sakit', 'Alpa'] as const).map((st) => {
                            const active = siswa.status === st;
                            let activeClass = '';
                            if (st === 'Hadir') activeClass = 'bg-emerald-700 text-white shadow-sm';
                            if (st === 'Izin') activeClass = 'bg-blue-600 text-white shadow-sm';
                            if (st === 'Sakit') activeClass = 'bg-amber-600 text-white shadow-sm';
                            if (st === 'Alpa') activeClass = 'bg-rose-600 text-white shadow-sm';

                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusChange(siswa.santri_id, st)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                                  active ? activeClass : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleSendSingleWA(siswa)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800 transition"
                          title="Kirim pesan WhatsApp ke orang tua"
                        >
                          <MessageSquareCode size={14} />
                          Kirim WA
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
  );
}