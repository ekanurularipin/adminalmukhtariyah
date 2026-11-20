import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9233073806:AAFClG8f1Xzb3aymQTprjM0M90nWygoGrVc';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Cek apakah ada pesan masuk dari Telegram
    if (body.message && body.message.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text.trim();
      const namaUser = body.message.from.first_name || 'User';

      let replyText = `Halo ${namaUser}! Selamat datang di bot layanan MTs Al-Mukhtariyah.`;

      // Jika user mengetik /start atau /id untuk mengambil Chat ID mereka
      if (text === '/start' || text === '/id') {
        replyText = `Halo ${namaUser}!\nID Telegram Anda adalah: \`${chatId}\`\n\nSilakan masukkan ID ini ke halaman pengaturan admin untuk menerima notifikasi absensi.`;
      } 
      // Contoh fitur cek rekap atau perintah lain
      else if (text.startsWith('/ceksiswa')) {
        replyText = `Fitur pencarian data siswa via bot sedang diproses.`;
      }

      // Kirim balasan kembali ke Telegram menggunakan Bot API
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
          parse_mode: 'Markdown'
        })
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error Telegram Webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}