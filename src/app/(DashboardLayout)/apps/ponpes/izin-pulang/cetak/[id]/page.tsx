'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import LoginLogo from '@/app/(DashboardLayout)/layout/shared/logo/loginlogo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CetakSuratIzinPage() {
  const params = useParams();
  const id = params?.id;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  async function fetchDetail() {
    setLoading(true);
    const { data: detail, error } = await supabase
      .from('izin_pulang')
      .select(`
        *,
        santri (
          nis,
          nama_santri,
          jk,
          kobong,
          wali
        )
      `)
      .eq('id', id)
      .single();

    if (!error && detail) {
      setData(detail);
    }
    setLoading(false);
  }

  if (loading) {
    return <div className="p-10 text-center text-gray-500 font-sans">Menyiapkan dokumen surat izin...</div>;
  }

  if (!data) {
    return <div className="p-10 text-center text-rose-500 font-sans">Data surat izin tidak ditemukan.</div>;
  }

  const formatTanggal = (tgl: string) => {
    return new Date(tgl).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 font-serif">
      
      {/* Tombol Navigasi (Hilang Otomatis Saat Dicetak) */}
      <div className="max-w-[21cm] mx-auto mb-6 flex items-center justify-between print:hidden font-sans">
        <Link
          href="/apps/ponpes/izin-pulang"
          className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition"
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar Izin
        </Link>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-sm transition"
        >
          <Printer size={18} />
          Cetak / Simpan PDF
        </button>
      </div>

      {/* Area Lembar Surat yang akan dicetak */}
      <div id="print-area" style={{ fontFamily: "'Times New Roman', Times, serif" }} className="max-w-[21cm] mx-auto bg-white text-black p-10 sm:p-14 shadow-xl border border-gray-300">
        
        {/* Kop Surat */}
        <div className="flex items-center gap-0 border-b-6 border-double border-black pb-0 mb-6">
          
          <div className="shrink-0">
            
            <LoginLogo/>
          </div>
          <div className="text-center flex-1 pr-25">
            <h2 className="text-sm font-bold uppercase tracking-wide text-black">YAYASAN PENDIDIKAN ISLAM</h2>
            <h1 className="text-[25px] font-extrabold uppercase tracking-wider text-green-800">PONDOK PESANTREN</h1>
            <h1 className="text-[25px] font-extrabold uppercase tracking-wider text-green-800">AL-MUKHTARIYAH</h1>
            <p className="text-[11px] mt-1 text-black">
              Pendidikan Formal & Non-Formal: PAUD · RA ·  MTs · TKA/TPA/DTA · Majelis Ta'lim 
            </p>
            <p className="text-[11px] mt-1 text-black">
              Kampung Rancamacan, Kelurahan Cipari, Kecamatan Mangkubumi, Kota Tasikmalaya
            </p>
            <p className="text-[11px] mt-1 text-black">
              Kota Tasikmalaya
            </p>
          </div>
        </div>

        {/* Judul Surat */}
        <div className="text-center mb-8">
          <h3 className="text-base font-bold underline uppercase tracking-wider text-black">SURAT IZIN PULANG SANTRI</h3>
          <p className="text-sm mt-1">Nomor: <span className="font-semibold">{data.nomor_surat}</span></p>
        </div>

        {/* Isi Surat */}
        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            <em>Assalamu&apos;alaikum Warahmatullahi Wabarakatuh.</em>
          </p>
          <p>
            Pengurus Bidang Keamanan dan Perizinan Pondok Pesantren Al-Mukhtariyah dengan ini memberikan izin pulang kepada santri tersebut di bawah ini:
          </p>

          <table className="w-full my-4 text-sm">
            <tbody>
              <tr>
                <td className="py-1.5 w-48 font-medium">Nama Lengkap</td>
                <td className="py-1.5 w-4">:</td>
                <td className="py-1.5 font-bold uppercase">{data.santri?.nama_santri}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-medium">Nomor Induk Santri (NIS)</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5">{data.santri?.nis}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-medium">Asrama / Kobong</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5">{data.santri?.kobong || '-'}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-medium">Keperluan Pulang</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5">{data.keperluan}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-medium">Dijemput Oleh</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5">{data.dijemput_oleh}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-medium">Kontak Wali / Penjemput</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5">{data.kontak_wali}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-medium">Tanggal Berangkat</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5">{formatTanggal(data.tanggal_berangkat)}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-medium">Wajib Kembali ke Pondok</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5 font-bold underline">{formatTanggal(data.wajib_kembali)}</td>
              </tr>
            </tbody>
          </table>

          <p>
            Demikian surat izin ini dibuat untuk dipergunakan sebagaimana mestinya. Santri yang bersangkutan wajib kembali ke pondok pesantren tepat pada waktu yang telah ditentukan serta menyerahkan kembali surat ini kepada bagian keamanan.
          </p>
          <p>
            <em>Wassalamu&apos;alaikum Warahmatullahi Wabarakatuh.</em>
          </p>
        </div>

        {/* Tanda Tangan */}
        <div className="grid grid-cols-3 mt-5 gap-[-10] text-sm text-[11px] text-center">
         <div>
            <p className="mb-26 text-[15px]">Orang Tua / Wali Penjemput,</p>
            <p className="font-bold underline uppercase">
              {data.dijemput_oleh ? data.dijemput_oleh.split('(')[0].trim() : '........................................'}
            </p>
          </div>

          <div>
            <p className="mb-26 text-[15px]">Penanggung Jawab,</p>
            <p className="font-bold underline"> ........................................ </p>
          </div>
          <div>
            <p className='text-[15px]'>
              Tasikmalaya,{' '}
              {new Date(data.tanggal_berangkat).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
            <p className="mb-22">Pimpinan Pondok Pesantren,</p>
            <p className="font-bold underline text-[11.5px]">Kh.Bubung Nizar Pamungkas,S.Pd.i</p>
          </div>
        </div>

        {/* Catatan Kaki */}
        <div className="mt-8 pt-3 border-t border-dashed border-gray-400 text-xs text-gray-600">
          <strong>Catatan:</strong> Keterlambatan kembali tanpa konfirmasi resmi kepada pengurus akan dikenakan sanksi ta&apos;zir sesuai tata tertib pondok pesantren.
        </div>

      </div>

      {/* CSS Trik Isolasi Print */}
      <style jsx global>{`
        @media print {
          /* Sembunyikan seluruh isi body secara default */
          body * {
            visibility: hidden;
          }
          /* Hanya tampilkan area surat dan isinya secara mutlak di pojok kiri atas */
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}