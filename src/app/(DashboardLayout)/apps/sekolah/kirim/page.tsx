'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Send, 
  Phone, 
  AtSign, 
  Users, 
  Calendar, 
  Layers
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface DetailAbsensiPenerima {
  id: number;
  santri_id: number;
  nis: string;
  nama_santri: string;
  status: string;
  wali: string;
  no_hp_wali: string;
  telegram_id: string;
}

export default function KirimPesanAbsensiPage() {
  const [listJadwal, setListJadwal] = useState<any[]>([]);
  const [selectedJadwalId, setSelectedJadwalId] = useState<string>('');
  const [activeJadwal, setActiveJadwal] = useState<any>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [tanggal, setTanggal] = useState<string>(todayStr);

  const [filterStatus, setFilterStatus] = useState<string>('Semua'); 
  const [penerimaList, setPenerimaList] = useState<DetailAbsensiPenerima[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [platform, setPlatform] = useState<'whatsapp' | 'telegram'>('whatsapp');

  const [templatePesan, setTemplatePesan] = useState<string>(
    `Assalamu'alaikum Wr. Wb.\n\nInformasi Akademik MTs Al-Mukhtariyah:\n\nKepada Yth. Bapak/Ibu Wali dari *[NAMA_SISWA]*.\n\nKami informasikan bahwa pada mata pelajaran *[MAPEL]* ([TANGGAL]), siswa yang bersangkutan tercatat berstatus: *[STATUS_ABSEN]*.\n\nDemikian informasi ini kami sampaikan. Terima kasih.\n\n*Hormat Kami,\nGuru Pengampu ([GURU])*`
  );

  useEffect(() => {
    fetchJadwal();
  }, []);

  async function fetchJadwal() {
    const { data } = await supabase
      .from('jadwal_pelajaran')
      .select('*')
      .order('hari', { ascending: true })
      .order('jam_mulai', { ascending: true });

    if (data && data.length > 0) {
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
      fetchDataAbsensiInput();
    }
  }, [activeJadwal, tanggal, filterStatus]);

  async function fetchDataAbsensiInput() {
    setLoading(true);
    try {
      const { data: headerData } = await supabase
        .from('absensi')
        .select('id')
        .eq('tanggal', tanggal)
        .eq('kelas', activeJadwal.kelas)
        .eq('mata_pelajaran', activeJadwal.mata_pelajaran)
        .maybeSingle();

      if (!headerData) {
        setPenerimaList([]);
        setLoading(false);
        return;
      }

      // Ambil detail absensi & join ke tabel santri (termasuk telegram_id)
      const { data: detailData } = await supabase
        .from('detail_absensi')
        .select(`
          id,
          santri_id,
          nis,
          nama_santri,
          status,
          santri (
            wali,
            no_hp_wali,
            telegram_id
          )
        `)
        .eq('absensi_id', headerData.id);

      let mapped: DetailAbsensiPenerima[] = (detailData || []).map((d: any) => ({
        id: d.id,
        santri_id: d.santri_id,
        nis: d.nis,
        nama_santri: d.nama_santri,
        status: d.status,
        wali: d.santri?.wali || 'Wali Siswa',
        no_hp_wali: d.santri?.no_hp_wali || '',
        telegram_id: d.santri?.telegram_id || ''
      }));

      if (filterStatus === 'Hadir') {
        mapped = mapped.filter((i) => i.status === 'Hadir');
      } else if (filterStatus === 'Izin') {
        mapped = mapped.filter((i) => i.status === 'Izin');
      } else if (filterStatus === 'Sakit') {
        mapped = mapped.filter((i) => i.status === 'Sakit');
      } else if (filterStatus === 'Alpa') {
        mapped = mapped.filter((i) => i.status === 'Alpa');
      } else if (filterStatus === 'Kecuali Hadir') {
        mapped = mapped.filter((i) => i.status !== 'Hadir');
      }

      setPenerimaList(mapped);
    } catch (err) {
      console.error('Gagal mengambil data absensi:', err);
    } finally {
      setLoading(false);
    }
  }

  // Fungsi Kirim Pesan (WhatsApp atau Telegram Pribadi)
  const handleKirimPesanSiswa = async (penerima: DetailAbsensiPenerima) => {
    const pesanFinal = templatePesan
      .replace(/\[NAMA_SISWA\]/g, penerima.nama_santri)
      .replace(/\[MAPEL\]/g, activeJadwal?.mata_pelajaran || '-')
      .replace(/\[TANGGAL\]/g, tanggal)
      .replace(/\[STATUS_ABSEN\]/g, penerima.status.toUpperCase())
      .replace(/\[GURU\]/g, activeJadwal?.nama_guru || '-');

    if (platform === 'whatsapp') {
      if (!penerima.no_hp_wali) {
        const inputNo = prompt(`Nomor HP Wali untuk ${penerima.nama_santri} belum ada.\nMasukkan nomor WhatsApp (contoh: 08123456789):`);
        if (!inputNo) return;
        penerima.no_hp_wali = inputNo;
      }

      let cleanedHp = penerima.no_hp_wali.replace(/\D/g, '');
      if (cleanedHp.startsWith('0')) cleanedHp = '62' + cleanedHp.slice(1);

      window.open(`https://wa.me/${cleanedHp}?text=${encodeURIComponent(pesanFinal)}`, '_blank');
    } else {
      // --- LOGIKA TELEGRAM PRIBADI ---
      if (!penerima.telegram_id) {
        const inputId = prompt(`ID Telegram Pribadi untuk wali dari ${penerima.nama_santri} belum ada.\nMasukkan Chat ID Telegram wali (contoh: 123456789):`);
        if (!inputId) return;
        penerima.telegram_id = inputId;
      }

      try {
        // Ambil token bot dari tabel pengaturan_api
        const { data: config, error } = await supabase
          .from('pengaturan_api')
          .select('bot_token, status_koneksi')
          .eq('platform', 'telegram')
          .maybeSingle();

        if (error || !config || config.status_koneksi !== 'Aktif' || !config.bot_token) {
          alert('Konfigurasi API Telegram belum diatur atau status belum Aktif di menu Pengaturan Telegram!');
          return;
        }

        const BOT_TOKEN = config.bot_token;

        // Kirim pesan langsung ke chat_id pribadi wali murid
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: penerima.telegram_id.trim(),
            text: pesanFinal,
            parse_mode: 'Markdown'
          })
        });

        const result = await response.json();

        if (result.ok) {
          alert(`Pesan Telegram pribadi ke wali ${penerima.nama_santri} berhasil dikirim!`);
        } else {
          alert('Gagal mengirim Telegram: ' + (result.description || 'Pastikan wali murid sudah pernah /start bot Anda.'));
        }
      } catch (err: any) {
        alert('Terjadi kesalahan jaringan: ' + err.message);
      }
    }
  };

  return (
    <div className="p-6 font-sans transition-colors duration-200 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kirim Pesan Berbasis Absensi</h1>
              <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Pribadi (Wali Murid)
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Kirim rekap kehadiran langsung ke chat pribadi Telegram atau WhatsApp orang tua.
            </p>
          </div>
        </div>

        {/* Panel Kontrol Atas */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Layers size={14} className="text-emerald-600" /> Pilih Jadwal / Kelas
            </label>
            <select
              value={selectedJadwalId}
              onChange={(e) => handleJadwalChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 font-semibold"
            >
              {listJadwal.map((j) => (
                <option key={j.id} value={j.id}>
                  [{j.hari}] Kelas {j.kelas} - {j.mata_pelajaran} ({j.nama_guru})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} className="text-emerald-600" /> Tanggal Absensi
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Filter Status Absen
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 font-semibold"
            >
              <option value="Semua">Tampilkan Semua (Hadir, Izin, Sakit, Alpa)</option>
              <option value="Hadir">Hanya yang Hadir</option>
              <option value="Izin">Hanya yang Izin</option>
              <option value="Sakit">Hanya yang Sakit</option>
              <option value="Alpa">Hanya yang Alpa</option>
              <option value="Kecuali Hadir">Kecuali Hadir (Izin, Sakit, Alpa)</option>
            </select>
          </div>
        </div>

        {/* Layout Utama */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Kolom Kiri: Template Pesan */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Konfigurasi Pesan
              </h3>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Pilih Platform</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlatform('whatsapp')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      platform === 'whatsapp'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600'
                    }`}
                  >
                    <Phone size={14} className="text-emerald-600" /> WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatform('telegram')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      platform === 'telegram'
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-700 dark:text-sky-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600'
                    }`}
                  >
                    <AtSign size={14} className="text-sky-500" /> Telegram
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Format Template Pesan</label>
                <p className="text-[11px] text-gray-400 mb-2">Tag otomatis: <code className="text-emerald-600">[NAMA_SISWA]</code>, <code className="text-emerald-600">[MAPEL]</code>, <code className="text-emerald-600">[TANGGAL]</code>, <code className="text-emerald-600">[STATUS_ABSEN]</code>, <code className="text-emerald-600">[GURU]</code></p>
                <textarea
                  rows={9}
                  value={templatePesan}
                  onChange={(e) => setTemplatePesan(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono leading-relaxed text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Daftar Siswa */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users size={16} className="text-emerald-600" />
                  Daftar Siswa Berdasarkan Absensi Terinput ({tanggal})
                </h3>
                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {penerimaList.length} Siswa Ditemukan
                </span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {loading ? (
                  <p className="text-center py-12 text-xs text-gray-400">Memuat data absensi dari database...</p>
                ) : penerimaList.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 space-y-2">
                    <p className="text-sm font-medium">Belum ada data absensi yang di-input untuk jadwal &amp; tanggal ini.</p>
                    <p className="text-xs">Silakan lakukan input absensi terlebih dahulu pada menu Absensi.</p>
                  </div>
                ) : (
                  penerimaList.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-white text-sm">{item.nama_santri}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'Izin' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'Sakit' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Wali: <strong className="text-gray-700 dark:text-gray-300">{item.wali}</strong> | 
                          {platform === 'whatsapp' ? (
                            <span> HP: <span className="font-mono text-emerald-600">{item.no_hp_wali || 'Belum diatur'}</span></span>
                          ) : (
                            <span> ID Telegram: <span className="font-mono text-sky-600">{item.telegram_id || 'Belum diatur'}</span></span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleKirimPesanSiswa(item)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition shrink-0"
                      >
                        <Send size={14} />
                        Kirim {platform === 'whatsapp' ? 'WA' : 'Telegram'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}