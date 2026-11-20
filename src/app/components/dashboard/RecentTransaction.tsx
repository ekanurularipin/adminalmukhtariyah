"use client";

import { useEffect, useMemo, useState } from "react";
import CardBox from "../shared/CardBox";
import { supabase } from "@/lib/supabase";

interface JadwalPelajaranRow {
  id: number;
  hari: string | null;
  mata_pelajaran: string | null;
  kelas: string | null;
  jam_mulai: string | null;
  jam_berakhir: string | null;
  created_at?: string | null;
  nama_guru: string | null;
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

const formatJam = (jam?: string | null): string => {
  if (!jam) return "--:--";
  const parts = String(jam).trim().split(":");
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  return String(jam).trim();
};

export const RecentTransaction = () => {
  const [jadwalList, setJadwalList] = useState<JadwalPelajaranRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function fetchJadwalPelajaran() {
      setLoading(true);
      setErrorMsg("");

      try {
        const { data, error } = await supabase
          .from("jadwal_pelajaran")
          .select("id, hari, mata_pelajaran, kelas, jam_mulai, jam_berakhir, created_at, nama_guru")
          .order("jam_mulai", { ascending: true });

        if (error) throw error;

        if (isMounted) {
          setJadwalList((data as JadwalPelajaranRow[]) || []);
        }
      } catch (err: unknown) {
        console.error("Gagal memuat tabel jadwal_pelajaran:", err);
        if (isMounted) {
          setErrorMsg("Gagal memuat data jadwal pelajaran.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchJadwalPelajaran();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedJadwal = useMemo(() => {
    return [...jadwalList].sort((a, b) => {
      const hariA = URUTAN_HARI[String(a.hari || "").trim().toLowerCase()] ?? 99;
      const hariB = URUTAN_HARI[String(b.hari || "").trim().toLowerCase()] ?? 99;
      if (hariA !== hariB) return hariA - hariB;

      const jamA = String(a.jam_mulai || "");
      const jamB = String(b.jam_mulai || "");
      return jamA.localeCompare(jamB);
    });
  }, [jadwalList]);

  return (
    <CardBox className="h-full w-full">
      <div className="flex flex-col">
        <h5 className="card-title">Jadwal Pelajaran</h5>
        <p className="text-sm text-muted-foreground font-normal">
          Daftar jadwal mengajar berdasarkan hari, jam, kelas, dan guru
        </p>
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Memuat jadwal pelajaran...</p>
        ) : errorMsg ? (
          <p className="text-sm text-error py-4">{errorMsg}</p>
        ) : sortedJadwal.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Belum ada data pada tabel jadwal_pelajaran.
          </p>
        ) : (
          sortedJadwal.map((item, idx) => {
            const isLastItem = idx === sortedJadwal.length - 1;
            const borderColor = BORDER_COLORS[idx % BORDER_COLORS.length];
            const jamMulai = formatJam(item.jam_mulai);
            const jamBerakhir = formatJam(item.jam_berakhir);

            return (
              <div key={item.id} className="flex gap-x-3">
                <div className="w-1/4 min-w-[84px] text-end">
                  <span className="block text-xs font-semibold text-foreground dark:text-muted-foreground">
                    {jamMulai} - {jamBerakhir}
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
                  <h6 className="text-sm font-semibold text-foreground mb-0.5">
                    {item.mata_pelajaran || "Mata Pelajaran"}
                  </h6>
                  <p className="text-xs font-medium text-muted-foreground mb-0">
                    Kelas {item.kelas || "-"} • {item.nama_guru || "-"}
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