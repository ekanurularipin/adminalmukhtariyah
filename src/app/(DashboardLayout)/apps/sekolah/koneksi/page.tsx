'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  AtSign, 
  Key, 
  Send, 
  CheckCircle2, 
  Save, 
  ShieldCheck, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PengaturanTelegramPage() {
  const [botToken, setBotToken] = useState<string>('');
  const [chatId, setChatId] = useState<string>('');
  const [statusKoneksi, setStatusKoneksi] = useState<string>('Nonaktif');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    fetchPengaturan();
  }, []);

  async function fetchPengaturan() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pengaturan_api')
        .select('*')
        .eq('platform', 'telegram')
        .maybeSingle();

      if (data) {
        setBotToken(data.bot_token || '');
        setChatId(data.chat_id || '');
        setStatusKoneksi(data.status_koneksi || 'Nonaktif');
      }
    } catch (err) {
      console.error('Gagal mengambil pengaturan:', err);
    } finally {
      setLoading(false);
    }
  }

  // Simpan data API Telegram ke Database
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      // Cek apakah data telegram sudah ada di database
      const { data: existing } = await supabase
        .from('pengaturan_api')
        .select('id')
        .eq('platform', 'telegram')
        .maybeSingle();

      const payload = {
        platform: 'telegram',
        bot_token: botToken.trim(),
        chat_id: chatId.trim(),
        status_koneksi: botToken.trim() ? 'Aktif' : 'Nonaktif',
        updated_at: new Date()
      };

      if (existing) {
        const { error } = await supabase
          .from('pengaturan_api')
          .update(payload)
          .eq('platform', 'telegram');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pengaturan_api')
          .insert([payload]);
        if (error) throw error;
      }

      setStatusKoneksi(payload.status_koneksi);
      setSuccessMsg('Konfigurasi API Telegram berhasil disimpan!');
    } catch (err: any) {
      alert('Gagal menyimpan pengaturan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Uji Koneksi / Kirim Pesan Tes ke Bot Telegram
  const handleTestKoneksi = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      alert('Bot Token dan Chat ID wajib diisi terlebih dahulu sebelum melakukan tes koneksi!');
      return;
    }

    setTesting(true);
    try {
      const text = encodeURIComponent('🔔 *TES KONEKSI BERHASIL!*\n\nSistem Manajemen MTs Al-Mukhtariyah berhasil terhubung dengan Telegram Bot Anda.');
      const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage?chat_id=${chatId.trim()}&text=${text}&parse_mode=Markdown`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.ok) {
        alert('Pesan tes berhasil dikirim ke Telegram Anda! Koneksi aktif.');
      } else {
        alert('Gagal terhubung ke Telegram: ' + (result.description || 'Periksa kembali Bot Token / Chat ID.'));
      }
    } catch (err: any) {
      alert('Terjadi kesalahan jaringan: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 font-sans transition-colors duration-200 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Koneksi API Telegram Bot</h1>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                statusKoneksi === 'Aktif' 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}>
                Status: {statusKoneksi}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Konfigurasikan Bot Telegram untuk pengiriman notifikasi kehadiran dan pesan broadcast madrasah.
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Konfigurasi */}
        <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <Key size={16} className="text-sky-500" /> Telegram Bot Token
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Dapatkan token bot melalui <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline inline-flex items-center gap-0.5">@BotFather <ExternalLink size={11} /></a> di aplikasi Telegram.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <AtSign size={16} className="text-sky-500" /> Admin / Group Chat ID
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: -1001234567890 atau ID Telegram Pribadi"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                ID chat tujuan penerima notifikasi atau grup laporan admin madrasah.
              </p>
            </div>
          </div>

          <div className="bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 p-4 rounded-xl flex items-start gap-3 text-xs text-sky-800 dark:text-sky-300">
            <HelpCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Panduan Singkat:</span> Pastikan Anda sudah memulai percakapan <i>(start)</i> dengan bot Telegram yang telah dibuat agar bot memiliki izin untuk mengirimkan pesan otomatis ke akun Anda.
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={handleTestKoneksi}
              disabled={testing || !botToken || !chatId}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-sm font-semibold rounded-xl border border-sky-200 dark:border-sky-800 transition disabled:opacity-50"
            >
              <Send size={16} />
              {testing ? 'Mengirim Tes...' : 'Uji Koneksi Telegram'}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-xl shadow-sm transition disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}