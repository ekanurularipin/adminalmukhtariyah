'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import {
  GraduationCap,
  LogOut,
  Calendar,
  BookOpen,
  Clock,
  CheckCircle2,
  CircleDot,
  Save,
  Lock,
  MessageCircle,
  Sparkles,
  Users,
  BarChart2,
  QrCode,
  CameraOff,
  Download,
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
// const supabase = createClient(supabaseUrl, supabaseKey);

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const getNamaHariIndonesia = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, (month || 1) - 1, day || 1);
  const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return hariMap[dateObj.getDay()] || '';
};

interface ProfilGuru {
  id?: number;
  nama_guru: string;
  nip?: string;
  mata_pelajaran?: string;
  tugas_tambahan?: string;
  email?: string;
}

interface JadwalMengajar {
  id: number | string;
  hari: string;
  kelas: string;
  mata_pelajaran: string;
  nama_guru: string;
  jam_mulai?: string;
  jam_berakhir?: string;
  sudahAbsenHariIni?: boolean;
}

interface SiswaAbsen {
  santri_id: number;
  nis: string;
  nisn?: string;
  nama_santri: string;
  jk: string;
  wali: string;
  no_hp_wali: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
}

interface RekapKehadiranSiswa {
  santri_id: number;
  nis: string;
  nisn?: string;
  nama_santri: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  pertemuan: number;
  persentase: number;
}

export default function PortalDashboardGuru() {
  const router = useRouter();

  const [guru, setGuru] = useState<ProfilGuru | null>(null);
  const [verifying, setVerifying] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'beranda' | 'absensi' | 'rekap'>('beranda');

  const todayStr = new Date().toISOString().split('T')[0];
  const [tanggal, setTanggal] = useState<string>(todayStr);

  const [jadwalList, setJadwalList] = useState<JadwalMengajar[]>([]);
  const [selectedJadwalId, setSelectedJadwalId] = useState<string>('');
  const [activeJadwal, setActiveJadwal] = useState<JadwalMengajar | null>(null);

  const [siswaList, setSiswaList] = useState<SiswaAbsen[]>([]);
  const [lockedSantriIds, setLockedSantriIds] = useState<number[]>([]);
  const [isSudahAbsen, setIsSudahAbsen] = useState<boolean>(false);
  const [rekapList, setRekapList] = useState<RekapKehadiranSiswa[]>([]);

  // State & Ref Scan QR NISN
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanFeedback, setScanFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [highlightedSantriId, setHighlightedSantriId] = useState<number | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [notifSukses, setNotifSukses] = useState<string>('');

  const namaHariAktif = getNamaHariIndonesia(tanggal);

  const stopQrScanner = useCallback(async () => {
    const scanner = qrScannerRef.current;
    qrScannerRef.current = null;
    setIsScanning(false);

    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        await scanner.clear();
      } catch {
        // Abaikan jika kamera sudah berhenti
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'absensi' || isSudahAbsen) {
      stopQrScanner();
    }
  }, [activeTab, isSudahAbsen, stopQrScanner]);

  useEffect(() => {
    return () => {
      stopQrScanner();
    };
  }, [stopQrScanner]);

  // Muat daftar jadwal milik guru yang login sesuai hari pada tanggal terpilih
  const muatJadwalGuru = useCallback(async (namaGuru: string, targetTanggal: string) => {
    const { data: jadwalData, error } = await supabase
      .from('jadwal_pelajaran')
      .select('*')
      .eq('nama_guru', namaGuru)
      .order('jam_mulai', { ascending: true });

    if (error) {
      console.error('Gagal mengambil jadwal guru:', error);
      return;
    }

    const { data: absenHariIni } = await supabase
      .from('absensi')
      .select('kelas, mata_pelajaran')
      .eq('tanggal', targetTanggal)
      .eq('nama_guru', namaGuru);

    const hariTarget = getNamaHariIndonesia(targetTanggal).trim().toLowerCase();

    const daftarJadwal: JadwalMengajar[] = (jadwalData || [])
      .filter((item: any) => String(item.hari || '').trim().toLowerCase() === hariTarget)
      .map((item: any) => {
        const selesai = (absenHariIni || []).some(
          (a: any) =>
            String(a.kelas || '').trim().toLowerCase() ===
              String(item.kelas || '').trim().toLowerCase() &&
            String(a.mata_pelajaran || '').trim().toLowerCase() ===
              String(item.mata_pelajaran || '').trim().toLowerCase()
        );
        return {
          ...item,
          sudahAbsenHariIni: selesai,
        };
      });

    setJadwalList(daftarJadwal);
    if (daftarJadwal.length > 0) {
      setSelectedJadwalId((prevId) => {
        const masihAda = daftarJadwal.some((j) => String(j.id) === prevId);
        const pilihan = masihAda
          ? daftarJadwal.find((j) => String(j.id) === prevId)!
          : daftarJadwal[0];
        setActiveJadwal(pilihan);
        return String(pilihan.id);
      });
    } else {
      setSelectedJadwalId('');
      setActiveJadwal(null);
    }
  }, []);

  // Cek sesi guru saat halaman dibuka
  useEffect(() => {
    async function cekSesiGuru() {
      setVerifying(true);
      try {
        const lokalGuru =
          typeof window !== 'undefined' ? localStorage.getItem('guru_session') : null;

        if (lokalGuru) {
          const dataGuru: ProfilGuru = JSON.parse(lokalGuru);
          setGuru(dataGuru);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.email) {
          const { data: guruDb } = await supabase
            .from('guru_mts')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();

          if (guruDb) {
            setGuru(guruDb);
            return;
          }
        }

        router.replace('/auth/login');
      } catch (err) {
        console.error('Error cek sesi guru:', err);
        router.replace('/auth/login');
      } finally {
        setVerifying(false);
      }
    }

    cekSesiGuru();
  }, [router]);

  // Sinkronkan jadwal setiap kali profil guru atau tanggal berubah
  useEffect(() => {
    if (guru?.nama_guru && tanggal) {
      stopQrScanner();
      setScanFeedback(null);
      setLockedSantriIds([]);
      muatJadwalGuru(guru.nama_guru, tanggal);
    }
  }, [guru, tanggal, muatJadwalGuru, stopQrScanner]);

  // Sinkronkan jadwal aktif ketika dropdown berubah
  const handlePilihJadwal = (idStr: string) => {
    stopQrScanner();
    setScanFeedback(null);
    setLockedSantriIds([]);
    setSelectedJadwalId(idStr);
    const ketemu = jadwalList.find((j) => String(j.id) === idStr) || null;
    setActiveJadwal(ketemu);
  };

  // Muat daftar siswa, status absen tanggal terpilih, dan rekap persiswa
  const muatDataKelasDanRekap = useCallback(async () => {
    if (!activeJadwal || !guru || !tanggal) {
      setSiswaList([]);
      setRekapList([]);
      setLockedSantriIds([]);
      setIsSudahAbsen(false);
      return;
    }

    setLoading(true);
    setNotifSukses('');
    setLockedSantriIds([]);
    try {
      const { data: santriRows, error: santriErr } = await supabase
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

      if (santriErr) throw santriErr;

      const siswaKelas = (santriRows || []).filter((s: any) => {
        const pend = Array.isArray(s.pendidikan_santri)
          ? s.pendidikan_santri[0]
          : s.pendidikan_santri;
        return (
          String(pend?.kelas || '').trim().toLowerCase() ===
          String(activeJadwal.kelas || '').trim().toLowerCase()
        );
      });

      const { data: headerAbsen } = await supabase
        .from('absensi')
        .select('id')
        .eq('tanggal', tanggal)
        .eq('kelas', activeJadwal.kelas)
        .eq('mata_pelajaran', activeJadwal.mata_pelajaran)
        .eq('nama_guru', guru.nama_guru)
        .maybeSingle();

      if (headerAbsen) {
        setIsSudahAbsen(true);
        const { data: detailRows } = await supabase
          .from('detail_absensi')
          .select('*')
          .eq('absensi_id', headerAbsen.id);

        const mappedSiswa: SiswaAbsen[] = siswaKelas.map((s: any) => {
          const cocok = detailRows?.find((d: any) => d.santri_id === s.id);
          return {
            santri_id: s.id,
            nis: s.nis,
            nisn: s.nisn || '',
            nama_santri: s.nama_santri,
            jk: s.jk,
            wali: s.wali || 'Wali Murid',
            no_hp_wali: s.no_hp_wali || '',
            status: cocok ? cocok.status : 'Hadir',
          };
        });
        setSiswaList(mappedSiswa);
      } else {
        setIsSudahAbsen(false);
        const mappedSiswa: SiswaAbsen[] = siswaKelas.map((s: any) => ({
          santri_id: s.id,
          nis: s.nis,
          nisn: s.nisn || '',
          nama_santri: s.nama_santri,
          jk: s.jk,
          wali: s.wali || 'Wali Murid',
          no_hp_wali: s.no_hp_wali || '',
          status: 'Hadir' as const,
        }));
        setSiswaList(mappedSiswa);
      }

      const { data: semuaHeaderGuru } = await supabase
        .from('absensi')
        .select('id')
        .eq('kelas', activeJadwal.kelas)
        .eq('mata_pelajaran', activeJadwal.mata_pelajaran)
        .eq('nama_guru', guru.nama_guru);

      const daftarIdAbsensi = (semuaHeaderGuru || []).map((h: any) => h.id);
      let semuaDetail: any[] = [];

      if (daftarIdAbsensi.length > 0) {
        const { data: detailRekap } = await supabase
          .from('detail_absensi')
          .select('santri_id, status')
          .in('absensi_id', daftarIdAbsensi);
        semuaDetail = detailRekap || [];
      }

      const rekapTerhitung: RekapKehadiranSiswa[] = siswaKelas.map((s: any) => {
        const riwayat = semuaDetail.filter((d: any) => d.santri_id === s.id);
        const hadir = riwayat.filter((r: any) => r.status === 'Hadir').length;
        const izin = riwayat.filter((r: any) => r.status === 'Izin').length;
        const sakit = riwayat.filter((r: any) => r.status === 'Sakit').length;
        const alpa = riwayat.filter((r: any) => r.status === 'Alpa').length;
        const pertemuan = riwayat.length;
        const persentase = pertemuan > 0 ? Math.round((hadir / pertemuan) * 100) : 0;

        return {
          santri_id: s.id,
          nis: s.nis,
          nisn: s.nisn || '',
          nama_santri: s.nama_santri,
          hadir,
          izin,
          sakit,
          alpa,
          pertemuan,
          persentase,
        };
      });

      setRekapList(rekapTerhitung);
    } catch (err) {
      console.error('Gagal memuat data kelas & rekap:', err);
    } finally {
      setLoading(false);
    }
  }, [activeJadwal, guru, tanggal]);

  useEffect(() => {
    if (guru && tanggal) {
      muatDataKelasDanRekap();
    }
  }, [activeJadwal, guru, tanggal, muatDataKelasDanRekap]);

  // Proses hasil scan QR (berisi NISN) & langsung kunci kehadiran siswa
  const handleQrDecoded = useCallback(
    (decodedText: string) => {
      if (isSudahAbsen) return;

      const cleanedCode = decodedText.trim();
      if (!cleanedCode) return;

      const now = Date.now();
      if (
        lastScannedRef.current.code === cleanedCode &&
        now - lastScannedRef.current.time < 1500
      ) {
        return;
      }
      lastScannedRef.current = { code: cleanedCode, time: now };

      setSiswaList((prev) => {
        const target = prev.find(
          (item) =>
            (item.nisn && String(item.nisn).trim() === cleanedCode) ||
            (item.nis && String(item.nis).trim() === cleanedCode)
        );

        if (!target) {
          setScanFeedback({
            type: 'error',
            text: `QR "${cleanedCode}" tidak cocok dengan siswa di kelas ${activeJadwal?.kelas || ''}.`,
          });
          return prev;
        }

        setHighlightedSantriId(target.santri_id);
        setTimeout(() => {
          setHighlightedSantriId((curr) => (curr === target.santri_id ? null : curr));
        }, 2500);

        setLockedSantriIds((prevLocked) => {
          if (prevLocked.includes(target.santri_id)) {
            setScanFeedback({
              type: 'success',
              text: `${target.nama_santri} sudah TERKUNCI (Hadir).`,
            });
            return prevLocked;
          }

          setScanFeedback({
            type: 'success',
            text: `${target.nama_santri} tercatat HADIR dan langsung TERKUNCI.`,
          });
          return [...prevLocked, target.santri_id];
        });

        return prev.map((item) =>
          item.santri_id === target.santri_id ? { ...item, status: 'Hadir' } : item
        );
      });
    },
    [activeJadwal?.kelas, isSudahAbsen]
  );

  const startQrScanner = async () => {
    if (!activeJadwal || isSudahAbsen || siswaList.length === 0 || isStartingRef.current) {
      return;
    }

    isStartingRef.current = true;
    setScanFeedback(null);

    try {
      await stopQrScanner();
      setIsScanning(true);

      await new Promise((resolve) => setTimeout(resolve, 120));

      const containerEl = document.getElementById('qr-reader-container');
      if (!containerEl) {
        throw new Error('Wadah kamera QR belum tersedia.');
      }

      const html5QrCode = new Html5Qrcode('qr-reader-container');
      qrScannerRef.current = html5QrCode;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        throw new Error('Tidak ada perangkat kamera terdeteksi.');
      }

      const rearCamera = cameras.find((cam) => /back|rear|environment/i.test(cam.label));
      const cameraId = rearCamera ? rearCamera.id : cameras[0].id;

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          handleQrDecoded(decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      console.error('Error kamera QR:', err);
      await stopQrScanner();
      setScanFeedback({
        type: 'error',
        text:
          err?.message ||
          'Kamera gagal diakses. Pastikan izin kamera aktif dan tidak dipakai aplikasi lain.',
      });
    } finally {
      isStartingRef.current = false;
    }
  };

  // Download Rekap Kehadiran Siswa ke Excel (.xls)
  const handleDownloadRekapExcel = () => {
    if (rekapList.length === 0) return;

    const escapeHtml = (val: string | number) =>
      String(val ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const rowsHtml = rekapList
      .map(
        (r, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(r.nis || '-')}</td>
          <td>${escapeHtml(r.nama_santri)}</td>
          <td>${r.hadir}</td>
          <td>${r.izin}</td>
          <td>${r.sakit}</td>
          <td>${r.alpa}</td>
          <td>${r.pertemuan}</td>
          <td>${r.persentase}%</td>
        </tr>
      `
      )
      .join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        <h3>Rekap Kehadiran Siswa</h3>
        <p>
          Guru: ${escapeHtml(guru?.nama_guru || '-')}<br/>
          Kelas: ${escapeHtml(activeJadwal?.kelas || '-')}<br/>
          Mata Pelajaran: ${escapeHtml(activeJadwal?.mata_pelajaran || '-')}
        </p>
        <table border="1" cellspacing="0" cellpadding="6">
          <thead>
            <tr>
              <th>No</th>
              <th>NIS</th>
              <th>Nama Siswa</th>
              <th>Hadir</th>
              <th>Izin</th>
              <th>Sakit</th>
              <th>Alpa</th>
              <th>Pertemuan</th>
              <th>Persentase Kehadiran</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeKelas = String(activeJadwal?.kelas || 'kelas').replace(/\s+/g, '_');
    const safeMapel = String(activeJadwal?.mata_pelajaran || 'mapel').replace(/\s+/g, '_');
    link.href = url;
    link.download = `rekap-kehadiran-${safeKelas}-${safeMapel}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const ubahStatusSiswa = (
    santri_id: number,
    status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa'
  ) => {
    if (isSudahAbsen || lockedSantriIds.includes(santri_id)) return;
    setSiswaList((prev) =>
      prev.map((row) => (row.santri_id === santri_id ? { ...row, status } : row))
    );
  };

  const setSemuaStatus = (status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa') => {
    if (isSudahAbsen) return;
    setSiswaList((prev) =>
      prev.map((row) =>
        lockedSantriIds.includes(row.santri_id) ? row : { ...row, status }
      )
    );
  };

  const kirimPesanWali = (siswa: SiswaAbsen) => {
    let nomor = siswa.no_hp_wali;
    if (!nomor) {
      const inputHp = prompt(
        `Nomor WhatsApp wali untuk ${siswa.nama_santri} belum tersedia.\nMasukkan nomor (contoh: 08123456789):`
      );
      if (!inputHp) return;
      nomor = inputHp;
    }

    let bersih = nomor.replace(/\D/g, '');
    if (bersih.startsWith('0')) {
      bersih = '62' + bersih.slice(1);
    }

    const isiPesan = `Assalamu'alaikum Wr. Wb.\n\nPemberitahuan Kehadiran Siswa:\nKepada Yth. Wali dari *${siswa.nama_santri}* (Kelas ${activeJadwal?.kelas}).\n\nPada tanggal *${tanggal}* untuk mata pelajaran *${activeJadwal?.mata_pelajaran}*, siswa tercatat berstatus: *${siswa.status.toUpperCase()}*.\n\nTerima kasih atas perhatiannya.\n\n*${guru?.nama_guru || activeJadwal?.nama_guru}*`;

    window.open(
      `https://wa.me/${bersih}?text=${encodeURIComponent(isiPesan)}`,
      '_blank'
    );
  };

  const simpanAbsensiGuru = async () => {
    if (!activeJadwal || !guru || siswaList.length === 0 || isSudahAbsen) return;

    await stopQrScanner();
    setSaving(true);
    setNotifSukses('');
    try {
      const { data: cekUlang } = await supabase
        .from('absensi')
        .select('id')
        .eq('tanggal', tanggal)
        .eq('kelas', activeJadwal.kelas)
        .eq('mata_pelajaran', activeJadwal.mata_pelajaran)
        .eq('nama_guru', guru.nama_guru)
        .maybeSingle();

      if (cekUlang) {
        setIsSudahAbsen(true);
        return;
      }

      const { data: insertedHeader, error: errHeader } = await supabase
        .from('absensi')
        .insert([
          {
            tanggal,
            kelas: activeJadwal.kelas,
            mata_pelajaran: activeJadwal.mata_pelajaran,
            nama_guru: guru.nama_guru,
          },
        ])
        .select('id')
        .single();

      if (errHeader) throw errHeader;

      const payloadDetail = siswaList.map((s) => ({
        absensi_id: insertedHeader.id,
        santri_id: s.santri_id,
        nis: s.nis,
        nama_santri: s.nama_santri,
        status: s.status,
      }));

      const { error: errDetail } = await supabase
        .from('detail_absensi')
        .insert(payloadDetail);
      if (errDetail) throw errDetail;

      setIsSudahAbsen(true);
      setLockedSantriIds([]);
      setNotifSukses(
        `Absensi Kelas ${activeJadwal.kelas} (${activeJadwal.mata_pelajaran}) tanggal ${tanggal} berhasil dicatat.`
      );

      await muatJadwalGuru(guru.nama_guru, tanggal);
      await muatDataKelasDanRekap();
    } catch (err: any) {
      alert('Gagal menyimpan absensi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const keluarAkunGuru = async () => {
    await stopQrScanner();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('guru_session');
      document.cookie = 'guru_auth=; path=/; max-age=0; SameSite=Lax';
    }
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Gagal signOut Supabase:', err);
    } finally {
      if (typeof window !== 'undefined') {
        window.location.replace('/auth/login');
      }
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen w-full bg-stone-100 flex items-center justify-center">
        <p className="text-sm font-medium text-stone-600">Menyiapkan ruang kelas guru...</p>
      </div>
    );
  }

  const jumlahHadir = siswaList.filter((s) => s.status === 'Hadir').length;
  const jumlahIzin = siswaList.filter((s) => s.status === 'Izin').length;
  const jumlahSakit = siswaList.filter((s) => s.status === 'Sakit').length;
  const jumlahAlpa = siswaList.filter((s) => s.status === 'Alpa').length;
  const rataRataKelas =
    rekapList.length > 0
      ? Math.round(rekapList.reduce((acc, r) => acc + r.persentase, 0) / rekapList.length)
      : 0;

  return (
    <div className="min-h-screen w-full bg-stone-100 text-stone-800 font-sans">
      {/* Header Khusus Guru (Tanpa Sidebar Admin) */}
      <header className="bg-teal-950 text-stone-50 border-b border-teal-800/60 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-teal-950 flex items-center justify-center shadow-sm">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] uppercase tracking-widest font-semibold text-amber-300">
                  Ruang Pengajar
                </span>
                {guru?.tugas_tambahan && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-900 text-teal-200 border border-teal-700/70">
                    {guru.tugas_tambahan}
                  </span>
                )}
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                {guru?.nama_guru}
              </h1>
              <p className="text-xs text-teal-200/80">
                {guru?.mata_pelajaran || 'Guru Mata Pelajaran'}
                {guru?.nip ? ` • NIP ${guru.nip}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={keluarAkunGuru}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-400/30 text-xs font-semibold transition"
          >
            <LogOut size={15} />
            Keluar
          </button>
        </div>

        {/* Navigasi Tab Khusus Guru */}
        <div className="max-w-6xl mx-auto px-5 flex gap-2 border-t border-teal-800/40 pt-2 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('beranda')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'beranda'
                ? 'bg-amber-500 text-teal-950 shadow-sm'
                : 'text-teal-200 hover:bg-teal-900/70'
            }`}
          >
            Jadwal &amp; Ringkasan
          </button>
          <button
            onClick={() => setActiveTab('absensi')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'absensi'
                ? 'bg-amber-500 text-teal-950 shadow-sm'
                : 'text-teal-200 hover:bg-teal-900/70'
            }`}
          >
            Input Absensi Kelas
          </button>
          <button
            onClick={() => setActiveTab('rekap')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'rekap'
                ? 'bg-amber-500 text-teal-950 shadow-sm'
                : 'text-teal-200 hover:bg-teal-900/70'
            }`}
          >
            Rekap Kehadiran Persiswa
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-7 space-y-6">
        {/* Bar Kontrol Jadwal Hari Aktif & Tanggal */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 mb-1.5">
              <BookOpen size={13} className="text-teal-700" />
              Jadwal Hari {namaHariAktif}
            </label>
            <select
              value={selectedJadwalId}
              onChange={(e) => handlePilihJadwal(e.target.value)}
              disabled={jadwalList.length === 0}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-semibold text-stone-800 focus:outline-none focus:border-teal-700 disabled:opacity-60"
            >
              {jadwalList.length === 0 ? (
                <option value="">Tidak ada jadwal mengajar pada hari {namaHariAktif}</option>
              ) : (
                jadwalList.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.hari} • Kelas {j.kelas} — {j.mata_pelajaran} (
                    {j.jam_mulai?.slice(0, 5) || '--:--'})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 mb-1.5">
              <Calendar size={13} className="text-amber-600" />
              Tanggal ({namaHariAktif})
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-semibold text-stone-800 focus:outline-none focus:border-teal-700"
            />
          </div>
        </div>

        {notifSukses && (
          <div className="p-4 rounded-2xl bg-teal-900 text-teal-50 flex items-center gap-2.5 text-sm shadow-xs">
            <CheckCircle2 size={18} className="text-amber-400 shrink-0" />
            <span>{notifSukses}</span>
          </div>
        )}

        {/* TAB 1: BERANDA JADWAL & RINGKASAN GURU */}
        {activeTab === 'beranda' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-stone-200/90">
                <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
                  <span>Jadwal Hari {namaHariAktif}</span>
                  <Sparkles size={16} className="text-amber-600" />
                </div>
                <p className="text-3xl font-extrabold text-teal-950 mt-2">
                  {jadwalList.length}{' '}
                  <span className="text-xs font-medium text-stone-400">Sesi</span>
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-stone-200/90">
                <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
                  <span>Absen Tanggal {tanggal}</span>
                  <Users size={16} className="text-teal-700" />
                </div>
                <p className="text-3xl font-extrabold text-teal-800 mt-2">
                  {jadwalList.filter((j) => j.sudahAbsenHariIni).length} / {jadwalList.length}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-stone-200/90">
                <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
                  <span>Rata-rata Kehadiran Kelas</span>
                  <BarChart2 size={16} className="text-amber-600" />
                </div>
                <p className="text-3xl font-extrabold text-stone-900 mt-2">
                  {rataRataKelas}%
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-stone-900 mb-3">
                Jadwal Mengajar Hari {namaHariAktif}
              </h2>
              {jadwalList.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center text-sm text-stone-400 border border-stone-200">
                  Tidak ada jadwal mengajar untuk {guru?.nama_guru} pada hari {namaHariAktif}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jadwalList.map((j) => {
                    const terpilih = activeJadwal?.id === j.id;
                    return (
                      <div
                        key={j.id}
                        onClick={() => handlePilihJadwal(String(j.id))}
                        className={`rounded-2xl p-5 border transition cursor-pointer flex flex-col justify-between gap-4 ${
                          terpilih
                            ? 'bg-teal-950 text-white border-teal-950 shadow-md'
                            : 'bg-white text-stone-800 border-stone-200 hover:border-teal-700/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span
                              className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                terpilih
                                  ? 'bg-amber-400 text-teal-950'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {j.hari} • Kelas {j.kelas}
                            </span>
                            <h3 className="text-lg font-bold mt-2">{j.mata_pelajaran}</h3>
                            <p
                              className={`text-xs flex items-center gap-1.5 mt-1 ${
                                terpilih ? 'text-teal-200' : 'text-stone-500'
                              }`}
                            >
                              <Clock size={13} />
                              {j.jam_mulai?.slice(0, 5) || '--:--'} -{' '}
                              {j.jam_berakhir?.slice(0, 5) || '--:--'} WIB
                            </p>
                          </div>

                          {j.sudahAbsenHariIni ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                              <CheckCircle2 size={12} /> Terabsen
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                              <CircleDot size={12} /> Menunggu
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-current/10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePilihJadwal(String(j.id));
                              setActiveTab('absensi');
                            }}
                            className={`text-xs font-bold px-3.5 py-2 rounded-xl transition ${
                              terpilih
                                ? 'bg-amber-500 text-teal-950 hover:bg-amber-400'
                                : 'bg-teal-900 text-white hover:bg-teal-800'
                            }`}
                          >
                            {j.sudahAbsenHariIni ? 'Lihat Kehadiran' : 'Mulai Absen'}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePilihJadwal(String(j.id));
                              setActiveTab('rekap');
                            }}
                            className={`text-xs font-semibold underline underline-offset-4 ${
                              terpilih
                                ? 'text-teal-200 hover:text-white'
                                : 'text-stone-600 hover:text-teal-900'
                            }`}
                          >
                            Lihat Rekap Siswa
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INPUT ABSENSI KELAS + SCAN QR NISN */}
        {activeTab === 'absensi' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Absensi Kelas {activeJadwal?.kelas || '-'} — {activeJadwal?.mata_pelajaran || '-'}
                </h2>
                <p className="text-xs text-stone-500">
                  {namaHariAktif}, {tanggal} • Pengampu: {guru?.nama_guru}
                  {lockedSantriIds.length > 0 && !isSudahAbsen
                    ? ` • ${lockedSantriIds.length} siswa terkunci via QR`
                    : ''}
                </p>
              </div>

              {!isSudahAbsen && siswaList.length > 0 && activeJadwal ? (
                <div className="flex flex-wrap items-center gap-2">
                  {!isScanning ? (
                    <button
                      type="button"
                      onClick={startQrScanner}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-teal-950 text-xs font-bold shadow-xs transition"
                    >
                      <QrCode size={16} />
                      Scan QR NISN
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopQrScanner}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      <CameraOff size={16} />
                      Tutup Kamera
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={simpanAbsensiGuru}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-900 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? 'Menyimpan...' : 'Simpan Absensi'}
                  </button>
                </div>
              ) : isSudahAbsen ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-100 text-teal-900 text-xs font-bold border border-teal-300">
                  <Lock size={14} /> Absensi Sudah Tersimpan
                </span>
              ) : null}
            </div>

            {!isSudahAbsen && (
              <div
                className={`bg-white rounded-2xl p-4 border border-stone-200 space-y-3 ${
                  isScanning || scanFeedback ? 'block' : 'hidden'
                }`}
              >
                <div className={isScanning ? 'max-w-sm mx-auto space-y-2' : 'hidden'}>
                  <div
                    id="qr-reader-container"
                    className="w-full min-h-[240px] overflow-hidden rounded-xl border border-stone-200 bg-stone-950 [&_video]:!block [&_video]:!w-full [&_video]:!h-auto"
                  />
                  <p className="text-center text-xs text-stone-500">
                    Arahkan QR pada kartu siswa (berisi NISN) ke kamera untuk mengunci kehadiran.
                  </p>
                </div>

                {scanFeedback && (
                  <div
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${
                      scanFeedback.type === 'success'
                        ? 'bg-teal-50 text-teal-900 border border-teal-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {scanFeedback.text}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200">
                <span className="text-xs text-stone-500">Hadir</span>
                <p className="text-xl font-extrabold text-teal-800 mt-0.5">{jumlahHadir}</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200">
                <span className="text-xs text-stone-500">Izin</span>
                <p className="text-xl font-extrabold text-sky-700 mt-0.5">{jumlahIzin}</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200">
                <span className="text-xs text-stone-500">Sakit</span>
                <p className="text-xl font-extrabold text-amber-600 mt-0.5">{jumlahSakit}</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200">
                <span className="text-xs text-stone-500">Alpa</span>
                <p className="text-xl font-extrabold text-rose-600 mt-0.5">{jumlahAlpa}</p>
              </div>
            </div>

            {!isSudahAbsen && siswaList.length > 0 && activeJadwal && (
              <div className="bg-white p-3 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-stone-600">
                  Tandai Massal (siswa terkunci QR tidak berubah):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSemuaStatus('Hadir')}
                    className="px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-semibold"
                  >
                    Semua Hadir
                  </button>
                  <button
                    onClick={() => setSemuaStatus('Izin')}
                    className="px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-semibold"
                  >
                    Semua Izin
                  </button>
                  <button
                    onClick={() => setSemuaStatus('Sakit')}
                    className="px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold"
                  >
                    Semua Sakit
                  </button>
                  <button
                    onClick={() => setSemuaStatus('Alpa')}
                    className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-semibold"
                  >
                    Semua Alpa
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      <th className="py-3.5 px-5 w-14">No</th>
                      <th className="py-3.5 px-5">Siswa</th>
                      <th className="py-3.5 px-5">Wali &amp; Kontak</th>
                      <th className="py-3.5 px-5 text-center">Kehadiran</th>
                      <th className="py-3.5 px-5 text-right">Wali WA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-stone-400">
                          Memuat daftar siswa...
                        </td>
                      </tr>
                    ) : !activeJadwal ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-stone-400">
                          Tidak ada jadwal mengajar pada hari {namaHariAktif}.
                        </td>
                      </tr>
                    ) : siswaList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-stone-400">
                          Tidak ada siswa pada kelas ini.
                        </td>
                      </tr>
                    ) : (
                      siswaList.map((s, idx) => {
                        const isLockedByQr = lockedSantriIds.includes(s.santri_id);

                        return (
                          <tr
                            key={s.santri_id}
                            className={`transition ${
                              highlightedSantriId === s.santri_id
                                ? 'bg-amber-100/90'
                                : isLockedByQr
                                ? 'bg-teal-50/50'
                                : 'hover:bg-stone-50/70'
                            }`}
                          >
                            <td className="py-3.5 px-5 font-mono text-xs text-stone-400">
                              {idx + 1}
                            </td>
                            <td className="py-3.5 px-5">
                              <div className="font-bold text-stone-900">{s.nama_santri}</div>
                              <div className="font-mono text-xs text-stone-500">
                                NIS {s.nis}
                                {s.nisn ? ` • NISN ${s.nisn}` : ''}
                              </div>
                            </td>
                            <td className="py-3.5 px-5">
                              <div className="text-xs font-semibold text-stone-700">{s.wali}</div>
                              <div className="font-mono text-xs text-teal-700">
                                {s.no_hp_wali || 'Belum ada nomor'}
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-center">
                              {isSudahAbsen ? (
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                    s.status === 'Hadir'
                                      ? 'bg-teal-100 text-teal-900'
                                      : s.status === 'Izin'
                                      ? 'bg-sky-100 text-sky-900'
                                      : s.status === 'Sakit'
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-rose-100 text-rose-900'
                                  }`}
                                >
                                  {s.status}
                                </span>
                              ) : isLockedByQr ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-900 text-white shadow-2xs">
                                  <Lock size={12} />
                                  {s.status} (Terkunci)
                                </span>
                              ) : (
                                <div className="inline-flex gap-1">
                                  {(['Hadir', 'Izin', 'Sakit', 'Alpa'] as const).map((st) => {
                                    const aktif = s.status === st;
                                    let warnaAktif = '';
                                    if (st === 'Hadir') warnaAktif = 'bg-teal-900 text-white';
                                    if (st === 'Izin') warnaAktif = 'bg-sky-700 text-white';
                                    if (st === 'Sakit') warnaAktif = 'bg-amber-500 text-stone-950';
                                    if (st === 'Alpa') warnaAktif = 'bg-rose-600 text-white';

                                    return (
                                      <button
                                        key={st}
                                        type="button"
                                        onClick={() => ubahStatusSiswa(s.santri_id, st)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                                          aktif
                                            ? `${warnaAktif} border-transparent`
                                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                                        }`}
                                      >
                                        {st}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <button
                                type="button"
                                onClick={() => kirimPesanWali(s)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-semibold border border-teal-200 transition"
                              >
                                <MessageCircle size={13} />
                                WA Wali
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
          </div>
        )}

        {/* TAB 3: REKAP KEHADIRAN PERSISWA */}
        {activeTab === 'rekap' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Rekap Kehadiran Persiswa — Kelas {activeJadwal?.kelas || '-'}
                </h2>
                <p className="text-xs text-stone-500">
                  Mata Pelajaran: {activeJadwal?.mata_pelajaran || '-'} • Guru: {guru?.nama_guru}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadRekapExcel}
                disabled={rekapList.length === 0}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-900 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
              >
                <Download size={15} />
                Download Excel
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      <th className="py-3.5 px-5 w-14">No</th>
                      <th className="py-3.5 px-5">Nama Siswa</th>
                      <th className="py-3.5 px-5 text-center">Hadir</th>
                      <th className="py-3.5 px-5 text-center">Izin</th>
                      <th className="py-3.5 px-5 text-center">Sakit</th>
                      <th className="py-3.5 px-5 text-center">Alpa</th>
                      <th className="py-3.5 px-5 text-center">Pertemuan</th>
                      <th className="py-3.5 px-5 text-right">Persentase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-stone-400">
                          Menghitung rekap kehadiran...
                        </td>
                      </tr>
                    ) : rekapList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-stone-400">
                          Belum ada rekap kehadiran siswa pada jadwal ini.
                        </td>
                      </tr>
                    ) : (
                      rekapList.map((r, i) => (
                        <tr key={r.santri_id} className="hover:bg-stone-50/70">
                          <td className="py-3.5 px-5 font-mono text-xs text-stone-400">{i + 1}</td>
                          <td className="py-3.5 px-5">
                            <div className="font-bold text-stone-900">{r.nama_santri}</div>
                            <div className="font-mono text-xs text-stone-500">NIS {r.nis}</div>
                          </td>
                          <td className="py-3.5 px-5 text-center font-bold text-teal-800">
                            {r.hadir}
                          </td>
                          <td className="py-3.5 px-5 text-center font-bold text-sky-700">
                            {r.izin}
                          </td>
                          <td className="py-3.5 px-5 text-center font-bold text-amber-600">
                            {r.sakit}
                          </td>
                          <td className="py-3.5 px-5 text-center font-bold text-rose-600">
                            {r.alpa}
                          </td>
                          <td className="py-3.5 px-5 text-center font-mono text-xs">
                            {r.pertemuan}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                r.persentase >= 75
                                  ? 'bg-teal-100 text-teal-900'
                                  : 'bg-rose-100 text-rose-900'
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
          </div>
        )}
      </main>
    </div>
  );
}