"use client"

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react/dist/iconify.js";
import CardBox from "../shared/CardBox";
import { ApexOptions } from "apexcharts";
import { supabase } from "@/lib/supabase";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type StatusAbsen = "Hadir" | "Izin" | "Sakit" | "Alpa";

interface AbsensiRow {
  id: number | string;
  tanggal?: string | null;
  created_at?: string | null;
  status?: string | null;
}

interface DetailAbsensiRow {
  id?: number | string;
  absensi_id?: number | string | null;
  status?: string | null;
}

const normalizeStatus = (raw?: string | null): StatusAbsen | null => {
  const val = String(raw || "").trim().toLowerCase();
  if (!val) return null;
  if (val === "hadir" || val === "h") return "Hadir";
  if (val === "izin" || val === "ijin" || val === "i") return "Izin";
  if (val === "sakit" || val === "s") return "Sakit";
  if (val === "alpa" || val === "alpha" || val === "alfa" || val === "a") return "Alpa";
  return null;
};

const getRecordMonthKey = (row: AbsensiRow): string | null => {
  const rawDate = row.tanggal || row.created_at;
  if (!rawDate) return null;

  const trimmed = String(rawDate).trim();
  // Jika format YYYY-MM-DD, ambil langsung YYYY-MM tanpa geser zona waktu
  const ymdMatch = trimmed.match(/^(\d{4}-\d{2})-\d{2}/);
  if (ymdMatch) return ymdMatch[1];

  const dt = new Date(trimmed);
  if (Number.isNaN(dt.getTime())) return null;
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getCurrentMonthKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatBulanLabel = (monthKey: string): string => {
  const [y, m] = monthKey.split("-").map(Number);
  const dt = new Date(y || new Date().getFullYear(), (m || 1) - 1, 1);
  return dt.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};

const MonthlyEarning = () => {
  const [absensiRows, setAbsensiRows] = useState<AbsensiRow[]>([]);
  const [detailRows, setDetailRows] = useState<DetailAbsensiRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const activeMonthKey = useMemo(() => getCurrentMonthKey(), []);
  const bulanLabel = useMemo(() => formatBulanLabel(activeMonthKey), [activeMonthKey]);

  useEffect(() => {
    let isMounted = true;

    async function fetchAbsensiBulanan() {
      setLoading(true);
      setErrorMsg("");

      try {
        const [absRes, detRes] = await Promise.all([
          supabase.from("absensi").select("*"),
          supabase.from("detail_absensi").select("absensi_id, status"),
        ]);

        if (absRes.error) throw absRes.error;

        if (isMounted) {
          setAbsensiRows((absRes.data as AbsensiRow[]) || []);
          setDetailRows(!detRes.error ? ((detRes.data as DetailAbsensiRow[]) || []) : []);
        }
      } catch (err: unknown) {
        console.error("Gagal memuat data tabel absensi:", err);
        if (isMounted) {
          setErrorMsg("Gagal memuat data dari tabel absensi.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAbsensiBulanan();

    return () => {
      isMounted = false;
    };
  }, []);

  const ringkasanBulan = useMemo(() => {
    const counts: Record<StatusAbsen, number> = {
      Hadir: 0,
      Izin: 0,
      Sakit: 0,
      Alpa: 0,
    };

    const absensiBulanIni = absensiRows.filter(
      (row) => getRecordMonthKey(row) === activeMonthKey
    );

    const idSetBulanIni = new Set(absensiBulanIni.map((r) => String(r.id)));

    // 1. Jika status ada langsung pada tabel absensi
    for (const row of absensiBulanIni) {
      const st = normalizeStatus(row.status);
      if (st) {
        counts[st] += 1;
      }
    }

    // 2. Hitung juga dari detail_absensi yang berelasi ke absensi bulan ini
    for (const det of detailRows) {
      if (det.absensi_id != null && idSetBulanIni.has(String(det.absensi_id))) {
        const st = normalizeStatus(det.status);
        if (st) {
          counts[st] += 1;
        }
      }
    }

    const totalData = counts.Hadir + counts.Izin + counts.Sakit + counts.Alpa;

    const urutanStatus: StatusAbsen[] = ["Hadir", "Izin", "Sakit", "Alpa"];
    let tertinggiStatus: StatusAbsen = "Hadir";
    let tertinggiJumlah = -1;

    for (const st of urutanStatus) {
      if (counts[st] > tertinggiJumlah) {
        tertinggiJumlah = counts[st];
        tertinggiStatus = st;
      }
    }

    const sparkData = urutanStatus.map((st) => counts[st]);

    return {
      counts,
      totalData,
      tertinggiStatus: totalData > 0 ? tertinggiStatus : "Belum Ada Data",
      tertinggiJumlah: totalData > 0 ? tertinggiJumlah : 0,
      sparkData,
    };
  }, [absensiRows, detailRows, activeMonthKey]);

  const ChartData: ApexOptions = {
    series: [
      {
        name: "Jumlah Absensi",
        color: "var(--color-secondary)",
        data:
          ringkasanBulan.totalData > 0
            ? ringkasanBulan.sparkData
            : [0, 0, 0, 0],
      },
    ],
    chart: {
      id: "weekly-stats2",
      type: "area",
      height: 60,
      sparkline: {
        enabled: true,
      },
      group: "sparklines",
      fontFamily: "inherit",
      foreColor: "#adb0bb",
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0,
        inverseColors: false,
        opacityFrom: 0.15,
        opacityTo: 0,
        stops: [20, 180],
      },
    },
    markers: {
      size: 0,
    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: true,
        position: "right",
      },
      x: {
        show: true,
        formatter: (_val, opts) => {
          const labels = ["Hadir", "Izin", "Sakit", "Alpa"];
          return labels[opts.dataPointIndex] || "";
        },
      },
      y: {
        formatter: (val: number) => `${val} data`,
      },
    },
  };

  return (
    <CardBox className="p-0! mt-0">
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between mb-2">
          <h5 className="card-title mb-0">Absensi Tertinggi Bulan Ini</h5>
          <div className="text-white bg-secondary rounded-full h-11 w-11 flex items-center justify-center">
            <Icon icon="tabler:chart-bar" className="text-xl" />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-12">
            {loading ? (
              <h4 className="text-xl font-bold mb-2">Memuat...</h4>
            ) : errorMsg ? (
              <p className="text-sm text-error mb-2">{errorMsg}</p>
            ) : (
              <>
                <h4 className="text-xl font-bold mb-1">
                  {ringkasanBulan.tertinggiStatus} ({ringkasanBulan.tertinggiJumlah})
                </h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full p-1 bg-lightsuccess dark:bg-darksuccess flex items-center justify-center">
                    <Icon icon="tabler:calendar-check" className="text-success text-sm" />
                  </span>
                  <p className="text-xs text-muted-foreground mb-0">
                    {bulanLabel} • Total {ringkasanBulan.totalData} catatan
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Hadir: <strong className="text-foreground">{ringkasanBulan.counts.Hadir}</strong>
                  </span>
                  <span>
                    Izin: <strong className="text-foreground">{ringkasanBulan.counts.Izin}</strong>
                  </span>
                  <span>
                    Sakit: <strong className="text-foreground">{ringkasanBulan.counts.Sakit}</strong>
                  </span>
                  <span>
                    Alpa: <strong className="text-foreground">{ringkasanBulan.counts.Alpa}</strong>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Chart
        options={ChartData}
        series={ChartData.series as ApexAxisChartSeries}
        type="area"
        height={60}
        width="100%"
      />
    </CardBox>
  );
};

export { MonthlyEarning };