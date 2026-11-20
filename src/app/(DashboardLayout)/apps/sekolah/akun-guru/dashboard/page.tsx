'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import {
  User,
  LogOut,
  Calendar,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ClipboardList,
  Users,
  BarChart3
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface GuruLogin {
  id?: number;
  nama_guru: string;
  nip?: string;
  mata_pelajaran?: string;
  tugas_tambahan?: string;
  email?: string;
}

interface JadwalItem {
  id: number | string;
  hari: string;
  kelas: string;
  mata_pelajaran: string;
  nama_guru: string;
  jam_mulai?: string;
  jam_berakhir?: string;
  sudahAbsenHariIni?: boolean;
}

interface RekapSiswa {
  santri_id: number;
  nis: string;
  nama_santri: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  totalPertemuan: number;
  persentase: number;
}

export default function DashboardGuruPage() {
  const router = useRouter();

  const [guruAktif, setGuruAktif] = useState<GuruLogin | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
  const [selectedJadwal, setSelectedJadwal] = useState<JadwalItem | null>(null);
  const [rekapList, setRekapList] = useState<RekapSiswa[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Verifikasi sesi guru yang sedang login
  useEffect(() => {
    async function checkGuruSession() {
      setAuthChecking(true);
      try {
        const savedGuru =
          typeof window !== 'undefined' ? localStorage.getItem('guru_session') : null;

        if (savedGuru) {
          const parsed: GuruLogin = JSON.parse(savedGuru);
          setGuruAktif(parsed);
          await loadJadwalDanStatusHariIni(parsed.nama_guru);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.email) {
          const { data: guruRow } = await supabase
            .from('guru_mts')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();

          if (guruRow) {
            setGuruAktif(guruRow);
            await loadJadwalDanStatusHariIni(guruRow.nama_guru);
            return;
          }
        }

        router.replace('/auth/login');
      } catch (err) {
        console.error('Gagal memverifikasi sesi guru:', err);
        router.replace('/auth/login');
      } finally {
        setAuthChecking(false);
      }
    }

    checkGuruSession();
  }, [router]);

  // 2. Ambil jadwal milik guru dan cek status absensi hari ini
  async function loadJadwalDanStatusHariIni(namaGuru: string) {
    setLoadingData(true);
    try {
      const { data: jadwalData, error } = await supabase
        .from('jadwal_pelajaran')
        .select('*')
        .eq('nama_guru', namaGuru)
        .order('hari', { ascending: true })
        .order('jam_mulai', { ascending: true });

      if (error) throw error;

      const { data: absensiHariIni } = await supabase
        .from('absensi')
        .select('kelas, mata_pelajaran')
        .eq('tanggal', todayStr)
        .eq('nama_guru', namaGuru);

      const enriched: JadwalItem[] = (jadwalData || []).map((j: any) => {
        const isDone = (absensiHariIni || []).some(
          (a: any) =>
            String(a.kelas).trim().toLowerCase() === String(j.kelas).trim().toLowerCase() &&
            String(a.mata_pelajaran).trim().toLowerCase() ===
              String(j.mata_pelajaran).trim().toLowerCase()
        );
        return {
          ...j,
          sudahAbsenHariIni: isDone,
        };
      });

      setJadwalList(enriched);
      if (enriched.length > 0) {
        setSelectedJadwal(enriched[0]);
      } else {
        setSelectedJadwal(null);
      }
    } catch (err) {
      console.error('Gagal memuat jadwal guru:', err);
    } finally {
      setLoadingData(false);
    }
  }

  // 3. Hitung rekap kehadiran persiswa untuk jadwal yang dipilih
  const loadRekapSiswa = useCallback(
    async (jadwal: JadwalItem, namaGuru: string) => {
      setLoadingData(true);
      try {
        const { data: siswaData, error: siswaErr } = await supabase
          .from('santri')
          .select(`
            id,
            nis,
            nama_santri,
            pendidikan_santri (
              kelas,
              jenis_pendidikan
            )
          `)
          .order('nama_santri', { ascending: true });

        if (siswaErr) throw siswaErr;

        const siswaKelas = (siswaData || []).filter((item: any) => {
          const pend = Array.isArray(item.pendidikan_santri)
            ? item.pendidikan_santri[0]
            : item.pendidikan_santri;
          const kelasSiswa = String(pend?.kelas || '').trim().toLowerCase();
          const targetKelas = String(jadwal.kelas || '').trim().toLowerCase();
          return kelasSiswa === targetKelas;
        });

        const { data: absensiRows } = await supabase
          .from('absensi')
          .select('id')
          .eq('kelas', jadwal.kelas)
          .eq('mata_pelajaran', jadwal.mata_pelajaran)
          .eq('nama_guru', namaGuru);

        const absensiIds = (absensiRows || []).map((a: any) => a.id);
        let detailRows: any[] = [];

        if (absensiIds.length > 0) {
          const { data: detailsRes } = await supabase
            .from('detail_absensi')
            .select('santri_id, status')
            .in('absensi_id', absensiIds);
          detailRows = detailsRes || [];
        }

        const mappedRekap: RekapSiswa[] = siswaKelas.map((s: any) => {
          const catatan = detailRows.filter((d: any) => d.santri_id === s.id);
          const hadir = catatan.filter((c: any) => c.status === 'Hadir').length;
          const izin = catatan.filter((c: any) => c.status === 'Izin').length;
          const sakit = catatan.filter((c: any) => c.status === 'Sakit').length;
          const alpa = catatan.filter((c: any) => c.status === 'Alpa').length;
          const totalPertemuan = catatan.length;
          const persentase =
            totalPertemuan > 0 ? Math.round((hadir / totalPertemuan) * 100) : 0;

          return {
            santri_id: s.id,
            nis: s.nis,
            nama_santri: s.nama_santri,
            hadir,
            izin,
            sakit,
            alpa,
            totalPertemuan,
            persentase,
          };
        });

        setRekapList(mappedRekap);
      } catch (err) {
        console.error('Gagal memuat rekap siswa:', err);
      } finally {
        setLoadingData(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedJadwal && guruAktif) {
      loadRekapSiswa(selectedJadwal, guruAktif.nama_guru);
    } else {
      setRekapList([]);
    }
  }, [selectedJadwal, guruAktif, loadRekapSiswa]);

  const handleLogout = async () => {
    localStorage.removeItem('guru_session');
    await supabase.auth.signOut();
    router.replace('/auth/login');
    router.refresh();
  };

  const handleBukaAbsensi = (jadwal: JadwalItem) => {
    const params = new URLSearchParams({
      jadwalId: String(jadwal.id),
      tanggal: todayStr,
    });
    router.push(`/guru/absensi?${params.toString()}`);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-sm text-gray-500">Memuat dashboard guru...</p>
      </div>
    );
  }

  const totalJadwal = jadwalList.length;
  const sudahAbsenCount = jadwalList.filter((j) => j.sudahAbsenHariIni).length;
  const rataRataKehadiran =
    rekapList.length > 0
      ? Math.round(
          rekapList.reduce((acc, item) => acc + item.persentase, 0) / rekapList.length
        )
      : 0;

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-200">
      {/* Header Khusus Guru (Tanpa Sidebar) */}
      <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
              <User size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {guruAktif?.nama_guru || 'Guru Pengampu'}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Dashboard Guru
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {guruAktif?.mata_pelajaran || 'Mata Pelajaran'}
                {guruAktif?.tugas_tambahan ? ` • ${guruAktif.tugas_tambahan}` : ''}
                {guruAktif?.nip ? ` • NIP: ${guruAktif.nip}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.push('/guru/absensi')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <ClipboardList size={15} />
              Halaman Absensi
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-800 transition"
            >
              <LogOut size={15} />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Ringkasan KPI Guru */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Jadwal Mengajar</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {totalJadwal} <span className="text-xs font-normal text-gray-400">Jadwal</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 flex items-center justify-center">
              <Calendar size={22} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Absensi Hari Ini ({todayStr})</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                {sudahAbsenCount} / {totalJadwal}{' '}
                <span className="text-xs font-normal text-gray-400">Selesai</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 flex items-center justify-center">
              <Users size={22} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">
                Rata-rata Kehadiran ({selectedJadwal?.kelas || '-'})
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {rataRataKehadiran}%
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <BarChart3 size={22} />
            </div>
          </div>
        </div>

        {/* Daftar Jadwal Mengajar Guru */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Jadwal Mengajar Anda
              </h2>
              <p className="text-xs text-gray-500">
                Klik baris jadwal untuk melihat rekap siswa atau klik tombol absensi untuk mencatat kehadiran hari ini.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50">
                  <th className="py-3.5 px-6">Hari &amp; Waktu</th>
                  <th className="py-3.5 px-6">Kelas</th>
                  <th className="py-3.5 px-6">Mata Pelajaran</th>
                  <th className="py-3.5 px-6 text-center">Status Hari Ini</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-200">
                {loadingData && jadwalList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">
                      Memuat jadwal mengajar...
                    </td>
                  </tr>
                ) : jadwalList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">
                      Belum ada jadwal mengajar yang terdaftar untuk {guruAktif?.nama_guru}.
                    </td>
                  </tr>
                ) : (
                  jadwalList.map((j) => {
                    const isSelected = selectedJadwal?.id === j.id;
                    return (
                      <tr
                        key={j.id}
                        onClick={() => setSelectedJadwal(j)}
                        className={`cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="font-bold text-gray-900 dark:text-white">{j.hari}</div>
                          <div className="text-xs font-mono text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock size={12} className="text-amber-600" />
                            {j.jam_mulai?.slice(0, 5) || '--:--'} -{' '}
                            {j.jam_berakhir?.slice(0, 5) || '--:--'} WIB
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-emerald-700 text-white text-xs font-bold">
                            Kelas {j.kelas}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen size={15} className="text-emerald-600" />
                            {j.mata_pelajaran}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {j.sudahAbsenHariIni ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 size={13} /> Sudah Diabsen
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              <AlertCircle size={13} /> Belum Diabsen
                            </span>
                          )}
                        </td>
                        <td
                          className="py-4 px-6 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleBukaAbsensi(j)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition"
                          >
                            {j.sudahAbsenHariIni ? 'Lihat Rekap/Absen' : 'Input Absensi'}
                            <ArrowRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rekap Kehadiran Persiswa */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Rekap Kehadiran Persiswa{' '}
                {selectedJadwal
                  ? `— Kelas ${selectedJadwal.kelas} (${selectedJadwal.mata_pelajaran})`
                  : ''}
              </h3>
              <p className="text-xs text-gray-500">
                Akumulasi kehadiran siswa yang tercatat oleh {guruAktif?.nama_guru}.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50">
                  <th className="py-3.5 px-6 w-16">No</th>
                  <th className="py-3.5 px-6">NIS &amp; Nama Siswa</th>
                  <th className="py-3.5 px-6 text-center">Hadir</th>
                  <th className="py-3.5 px-6 text-center">Izin</th>
                  <th className="py-3.5 px-6 text-center">Sakit</th>
                  <th className="py-3.5 px-6 text-center">Alpa</th>
                  <th className="py-3.5 px-6 text-center">Pertemuan</th>
                  <th className="py-3.5 px-6 text-right">% Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-200">
                {loadingData ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-400">
                      Memuat rekap kehadiran siswa...
                    </td>
                  </tr>
                ) : rekapList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-400">
                      Belum ada data kehadiran siswa untuk jadwal ini.
                    </td>
                  </tr>
                ) : (
                  rekapList.map((r, idx) => (
                    <tr
                      key={r.santri_id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition"
                    >
                      <td className="py-3.5 px-6 font-mono text-gray-500">{idx + 1}</td>
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {r.nama_santri}
                        </div>
                        <div className="font-mono text-xs text-gray-500">NIS: {r.nis}</div>
                      </td>
                      <td className="py-3.5 px-6 text-center font-bold text-emerald-700 dark:text-emerald-400">
                        {r.hadir}
                      </td>
                      <td className="py-3.5 px-6 text-center font-bold text-blue-700 dark:text-blue-400">
                        {r.izin}
                      </td>
                      <td className="py-3.5 px-6 text-center font-bold text-amber-700 dark:text-amber-400">
                        {r.sakit}
                      </td>
                      <td className="py-3.5 px-6 text-center font-bold text-rose-700 dark:text-rose-400">
                        {r.alpa}
                      </td>
                      <td className="py-3.5 px-6 text-center font-mono text-xs">
                        {r.totalPertemuan}
                      </td>
                      <td className="py-3.5 px-6 text-right font-bold">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs ${
                            r.persentase >= 75
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.persentase}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}