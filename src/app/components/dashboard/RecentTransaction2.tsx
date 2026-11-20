"use client";

import { useEffect, useMemo, useState } from "react";
import CardBox from "../shared/CardBox";
import { supabase } from "@/lib/supabase";

interface JadwalMengajiRow {
  id: string;
  hari: string | null;
  waktu_mulai: string | null;
  waktu_selesai: string | null;
  jenis_pelajaran: string | null;
  pengajar: string | null;
  lokasi: string | null;
  kelompok: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

const URUTAN_HARI: Record<string, number> = {
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  "jum'at": 5,
  sabtu: 6,
  minggu: 7,
};

const BORDER_COLORS = [
  "border-primary",
  "border-info",
  "border-success",
  "border-warning",
  "border-error",
  "border-secondary",
];

const formatWaktu = (waktu?: string | null): string => {
  if (!waktu) return "--:--";
  const parts = String(waktu).trim().split(":");
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  return String(waktu).trim();
};

export const RecentTransaction2 = () => {
  const [jadwalList, setJadwalList] = useState<JadwalMengajiRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function fetchJadwalMengaji() {
      setLoading(true);
      setErrorMsg("");

      try {
        const { data, error } = await supabase
          .from("jadwal_mengaji")
          .select(
            "id, hari, waktu_mulai, waktu_selesai, jenis_pelajaran, pengajar, lokasi, kelompok, created_at, updated_at"
          )
          .order("waktu_mulai", { ascending: true });

        if (error) throw error;

        if (isMounted) {
          setJadwalList((data as JadwalMengajiRow[]) || []);
        }
      } catch (err: unknown) {
        console.error("Gagal memuat tabel jadwal_mengaji:", err);
        if (isMounted) {
          setErrorMsg("Gagal memuat data jadwal mengaji.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchJadwalMengaji();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedJadwal = useMemo(() => {
    return [...jadwalList].sort((a, b) => {
      const hariA = URUTAN_HARI[String(a.hari || "").trim().toLowerCase()] ?? 99;
      const hariB = URUTAN_HARI[String(b.hari || "").trim().toLowerCase()] ?? 99;
      if (hariA !== hariB) return hariA - hariB;

      const jamA = String(a.waktu_mulai || "");
      const jamB = String(b.waktu_mulai || "");
      return jamA.localeCompare(jamB);
    });
  }, [jadwalList]);

  return (
    <CardBox className="h-full w-full">
      <div className="flex flex-col">
        <h5 className="card-title">Jadwal Mengaji</h5>
        <p className="text-sm text-muted-foreground font-normal">
          Daftar jadwal mengaji berdasarkan hari, waktu, lokasi, dan pengajar
        </p>
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Memuat jadwal mengaji...</p>
        ) : errorMsg ? (
          <p className="text-sm text-error py-4">{errorMsg}</p>
        ) : sortedJadwal.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Belum ada data pada tabel jadwal_mengaji.
          </p>
        ) : (
          sortedJadwal.map((item, idx) => {
            const isLastItem = idx === sortedJadwal.length - 1;
            const borderColor = BORDER_COLORS[idx % BORDER_COLORS.length];
            const waktuMulai = formatWaktu(item.waktu_mulai);
            const waktuSelesai = formatWaktu(item.waktu_selesai);

            return (
              <div key={item.id} className="flex gap-x-3">
                <div className="w-1/4 min-w-[84px] text-end">
                  <span className="block text-xs font-semibold text-foreground dark:text-muted-foreground">
                    {waktuMulai} - {waktuSelesai}
                  </span>
                  <span className="block text-[11px] text-muted-foreground capitalize">
                    {item.hari || "-"}
                  </span>
                </div>

                <div
                  className={`relative ${
                    isLastItem ? "after:hidden" : ""
                  } after:absolute after:top-7 after:bottom-0 after:start-3.5 after:w-px after:-translate-x-[0.5px] after:bg-border`}
                >
                  <div className="relative z-1 w-7 h-7 flex justify-center items-center">
                    <div
                      className={`h-3 w-3 rounded-full bg-transparent border-2 ${borderColor}`}
                    />
                  </div>
                </div>

                <div className="w-1/4 grow pt-0.5 pb-6">
                  <h6 className="text-sm font-semibold text-foreground mb-0.5 capitalize">
                    {item.jenis_pelajaran || "Jenis Pelajaran"}
                  </h6>
                  <p className="text-xs font-medium text-muted-foreground mb-0 capitalize">
                    {item.lokasi || "-"} • {item.kelompok || "-"} • {item.pengajar || "-"}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </CardBox>
  );
};