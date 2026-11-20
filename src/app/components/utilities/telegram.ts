export async function kirimPesanTelegram(chatId: string, pesan: string) {
  // Token Bot Telegram Anda
  const BOT_TOKEN = '9233073806:AAFClG8f1Xzb3aymQTprjM0M90nWygoGrVc'; 

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId, // Contoh: ID pribadi admin atau ID grup (-100...)
        text: pesan,
        parse_mode: 'Markdown'
      })
    });

    const result = await response.json();
    if (result.ok) {
      console.log('Pesan Telegram berhasil terkirim!');
      return true;
    } else {
      console.error('Gagal kirim Telegram:', result.description);
      return false;
    }
  } catch (error) {
    console.error('Terjadi kesalahan jaringan:', error);
    return false;
  }
}