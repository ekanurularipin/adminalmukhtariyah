"use client"

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react/dist/iconify.js";
import CardBox from "../shared/CardBox";
import { ApexOptions } from "apexcharts";
import { supabase } from "@/lib/supabase";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface PendidikanSantriRow {
  id?: number | string;
  santri_id?: number | string | null;
  id_santri?: number | string | null;
  jenis_pendidikan?: string | null;
  status?: string | null;
}

interface SantriRow {
  id: number | string;
  jk?: string | null;
  status?: string | null;
  status_santri?: string | null;
  kategori?: string | null;
  jenis_pendidikan?: string | null;
  pendidikan_santri?: PendidikanSantriRow | PendidikanSantriRow[] | null;
}

const JENIS_PENDIDIKAN_COLORS = [
  "#5d87ff", // Biru primary
  "#13deb9", // Teal / mint
  "#ffae1f", // Amber / kuning
  "#fa896b", // Coral / merah muda
  "#49beff", // Sky blue
  "#7c5dfa", // Ungu
  "#64748b", // Slate
];

const normalizeGender = (jk?: string | null): string => {
  const val = String(jk || "").trim().toLowerCase();
  if (!val) return "Tidak Diketahui";
  if (val === "l" || val.startsWith("laki") || val.includes("putra") || val.includes("male")) {
    return "Laki-laki";
  }
  if (val === "p" || val.startsWith("perempuan") || val.includes("putri") || val.includes("female")) {
    return "Perempuan";
  }
  return String(jk).trim();
};

const resolvePendidikan = (
  row: SantriRow,
  pendidikanMapBySantriId: Map<string, PendidikanSantriRow>
): PendidikanSantriRow | undefined => {
  const fromMap = pendidikanMapBySantriId.get(String(row.id));
  if (fromMap) return fromMap;

  const pend = row.pendidikan_santri;
  if (!pend) return undefined;
  return Array.isArray(pend) ? pend[0] : pend;
};

// Ambil jenis_pendidikan dari tabel pendidikan_santri
const extractJenisPendidikan = (
  row: SantriRow,
  pendidikanMapBySantriId: Map<string, PendidikanSantriRow>
): string => {
  const pend = resolvePendidikan(row, pendidikanMapBySantriId);
  const dariPendidikanSantri = String(pend?.jenis_pendidikan || "").trim();
  if (dariPendidikanSantri) return dariPendidikanSantri;

  const fallbackSantri = String(row.jenis_pendidikan || "").trim();
  return fallbackSantri || "Tanpa Jenis Pendidikan";
};

const extractStatus = (
  row: SantriRow,
  pendidikanMapBySantriId: Map<string, PendidikanSantriRow>
): string => {
  const pend = resolvePendidikan(row, pendidikanMapBySantriId);
  const rawStatus =
    row.status ||
    row.status_santri ||
    row.kategori ||
    pend?.status ||
    "";

  const cleaned = String(rawStatus).trim();
  return cleaned || "Tanpa Status";
};

const YearlyBreakup = () => {
  const [rows, setRows] = useState<SantriRow[]>([]);
  const [pendidikanRows, setPendidikanRows] = useState<PendidikanSantriRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function fetchAllData() {
      setLoading(true);
      setErrorMsg("");

      try {
        const [santriRes, pendidikanRes] = await Promise.all([
          supabase.from("santri").select("*"),
          supabase.from("pendidikan_santri").select("*"),
        ]);

        if (santriRes.error) throw santriRes.error;
        if (pendidikanRes.error) {
          console.warn("Peringatan ambil pendidikan_santri:", pendidikanRes.error.message);
        }

        if (isMounted) {
          setRows((santriRes.data as SantriRow[]) || []);
          setPendidikanRows((pendidikanRes.data as PendidikanSantriRow[]) || []);
        }
      } catch (err: unknown) {
        console.error("Gagal mengambil data santri & pendidikan_santri:", err);
        if (isMounted) {
          setErrorMsg("Gagal memuat data dari database.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, []);

  const ringkasan = useMemo(() => {
    const pendidikanMapBySantriId = new Map<string, PendidikanSantriRow>();
    for (const p of pendidikanRows) {
      const refId = p.santri_id ?? p.id_santri ?? p.id;
      if (refId !== undefined && refId !== null && String(refId).trim() !== "") {
        pendidikanMapBySantriId.set(String(refId).trim(), p);
      }
    }

    const totalSemua = rows.length;
    const genderMap = new Map<string, number>();
    const statusMap = new Map<string, number>();
    const jenisPendidikanMap = new Map<string, number>();

    for (const row of rows) {
      const genderLabel = normalizeGender(row.jk);
      genderMap.set(genderLabel, (genderMap.get(genderLabel) || 0) + 1);

      const statusLabel = extractStatus(row, pendidikanMapBySantriId);
      statusMap.set(statusLabel, (statusMap.get(statusLabel) || 0) + 1);

      const jenisLabel = extractJenisPendidikan(row, pendidikanMapBySantriId);
      jenisPendidikanMap.set(jenisLabel, (jenisPendidikanMap.get(jenisLabel) || 0) + 1);
    }

    return {
      totalSemua,
      perGender: Array.from(genderMap.entries()).map(([label, jumlah]) => ({
        label,
        jumlah,
      })),
      perStatus: Array.from(statusMap.entries()).map(([label, jumlah]) => ({
        label,
        jumlah,
      })),
      perJenisPendidikan: Array.from(jenisPendidikanMap.entries()).map(
        ([label, jumlah], idx) => ({
          label,
          jumlah,
          color: JENIS_PENDIDIKAN_COLORS[idx % JENIS_PENDIDIKAN_COLORS.length],
        })
      ),
    };
  }, [rows, pendidikanRows]);

  const hasChartData = ringkasan.perJenisPendidikan.length > 0 && ringkasan.totalSemua > 0;

  const series = hasChartData
    ? ringkasan.perJenisPendidikan.map((item) => item.jumlah)
    : [1];

  const labels = hasChartData
    ? ringkasan.perJenisPendidikan.map((item) => item.label)
    : ["Belum Ada Data"];

  const colors = hasChartData
    ? ringkasan.perJenisPendidikan.map((item) => item.color)
    : ["#e5e7eb"];

  const ChartData: ApexOptions = {
    series,
    labels,
    chart: {
      type: "donut",
      fontFamily: "inherit",
      foreColor: "#adb0bb",
      height: 200,
      offsetX: 10,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      pie: {
        startAngle: 0,
        endAngle: 360,
        donut: {
          size: "75%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              formatter: () => `${ringkasan.totalSemua}`,
            },
          },
        },
      },
    },
    stroke: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    colors,
    tooltip: {
      theme: "dark",
      fillSeriesColor: false,
      enabled: hasChartData,
      y: {
        formatter: (val: number) => `${val} orang`,
      },
    },
  };

  return (
    <CardBox>
      <div className="grid grid-cols-12 items-center gap-3">
        <div className="flex flex-col lg:col-span-7 md:col-span-7 col-span-7 space-y-2.5">
          <div>
            <h5 className="card-title mb-1.5 lg:whitespace-nowrap">
              Rekap Santri &amp; Siswa
            </h5>
            <h4 className="text-2xl font-bold mb-1">
              {loading ? "..." : `${ringkasan.totalSemua} Orang`}
            </h4>
            <div className="flex items-center gap-2">
              <span className="rounded-full p-1 bg-lightsuccess dark:bg-darksuccess flex items-center justify-center">
                <Icon icon="tabler:users" className="text-success text-sm" />
              </span>
              <p className="text-xs text-muted-foreground mb-0">
                Semua status &amp; jenis kelamin
              </p>
            </div>
          </div>

          {errorMsg ? (
            <p className="text-xs text-error">{errorMsg}</p>
          ) : (
            <div className="space-y-2 pt-0.5">
              {/* Rincian Jenis Kelamin */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Jenis Kelamin
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {ringkasan.perGender.length > 0 ? (
                    ringkasan.perGender.map((g) => (
                      <span key={g.label} className="text-xs text-foreground">
                        {g.label}: <strong>{g.jumlah}</strong>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>
              </div>

              {/* Rincian Semua Status */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Status
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {ringkasan.perStatus.length > 0 ? (
                    ringkasan.perStatus.map((st) => (
                      <span key={st.label} className="text-xs text-foreground">
                        {st.label}: <strong>{st.jumlah}</strong>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>
              </div>

              {/* Legenda Warna Jenis Pendidikan (Dari Tabel pendidikan_santri) */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Jenis Pendidikan
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {ringkasan.perJenisPendidikan.length > 0 ? (
                    ringkasan.perJenisPendidikan.map((jp) => (
                      <div key={jp.label} className="flex items-center text-xs">
                        <Icon
                          icon="tabler:point-filled"
                          className="text-base me-1"
                          style={{ color: jp.color }}
                        />
                        <span className="text-muted-foreground me-1">{jp.label}:</span>
                        <strong>{jp.jumlah}</strong>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 md:col-span-5 col-span-5">
          <div className="flex justify-center">
            <Chart
              options={ChartData}
              series={ChartData.series as number[]}
              type="donut"
              height={200}
              width={185}
            />
          </div>
        </div>
      </div>
    </CardBox>
  );
};

export { YearlyBreakup };