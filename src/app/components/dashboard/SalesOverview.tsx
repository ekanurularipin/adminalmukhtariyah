"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import CardBox from "../shared/CardBox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApexOptions } from "apexcharts";
import { supabase } from "@/lib/supabase";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SantriGenderRow {
  id?: number | string;
  jk?: string | null;
  created_at?: string | null;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const normalizeGenderCategory = (jk?: string | null): "Laki-laki" | "Perempuan" | "Lainnya" => {
  const val = String(jk || "").trim().toLowerCase();
  if (
    val === "l" ||
    val.startsWith("laki") ||
    val.includes("putra") ||
    val.includes("male") ||
    val.includes("lk")
  ) {
    return "Laki-laki";
  }
  if (
    val === "p" ||
    val.startsWith("perempuan") ||
    val.includes("putri") ||
    val.includes("female") ||
    val.includes("pr")
  ) {
    return "Perempuan";
  }
  return "Lainnya";
};

const SalesOverview: React.FC = () => {
  const [rows, setRows] = useState<SantriGenderRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function fetchSantriMonthly() {
      setLoading(true);
      setErrorMsg("");

      try {
        const { data, error } = await supabase
          .from("santri")
          .select("id, jk, created_at");

        if (error) throw error;

        if (isMounted) {
          setRows((data as SantriGenderRow[]) || []);
        }
      } catch (err: unknown) {
        console.error("Gagal memuat data bulanan santri:", err);
        if (isMounted) {
          setErrorMsg("Gagal memuat data santri dari database.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSantriMonthly();

    return () => {
      isMounted = false;
    };
  }, []);

  const groupedByYear = useMemo(() => {
    const yearSet = new Set<string>();
    const currentYearStr = String(new Date().getFullYear());
    yearSet.add(currentYearStr);

    const parsedValidRows: {
      year: string;
      monthIndex: number;
      gender: "Laki-laki" | "Perempuan" | "Lainnya";
    }[] = [];

    for (const row of rows) {
      if (!row.created_at) continue;
      const dateObj = new Date(row.created_at);
      if (Number.isNaN(dateObj.getTime())) continue;

      const yearStr = String(dateObj.getFullYear());
      const monthIndex = dateObj.getMonth(); // 0..11
      const gender = normalizeGenderCategory(row.jk);

      yearSet.add(yearStr);
      parsedValidRows.push({
        year: yearStr,
        monthIndex,
        gender,
      });
    }

    const sortedYears = Array.from(yearSet).sort((a, b) => Number(b) - Number(a));

    const mapByYear: Record<
      string,
      {
        laki: number[];
        perempuan: number[];
        lainnya: number[];
        totalYear: number;
      }
    > = {};

    for (const yr of sortedYears) {
      mapByYear[yr] = {
        laki: Array(12).fill(0),
        perempuan: Array(12).fill(0),
        lainnya: Array(12).fill(0),
        totalYear: 0,
      };
    }

    for (const item of parsedValidRows) {
      const bucket = mapByYear[item.year];
      if (!bucket) continue;

      if (item.gender === "Laki-laki") {
        bucket.laki[item.monthIndex] += 1;
      } else if (item.gender === "Perempuan") {
        bucket.perempuan[item.monthIndex] += 1;
      } else {
        bucket.lainnya[item.monthIndex] += 1;
      }
      bucket.totalYear += 1;
    }

    return {
      years: sortedYears,
      mapByYear,
    };
  }, [rows]);

  useEffect(() => {
    if (groupedByYear.years.length > 0) {
      setSelectedYear((prev) =>
        prev && groupedByYear.years.includes(prev) ? prev : groupedByYear.years[0]
      );
    }
  }, [groupedByYear.years]);

  const activeYear = selectedYear || groupedByYear.years[0] || String(new Date().getFullYear());
  const activeStats = groupedByYear.mapByYear[activeYear] || {
    laki: Array(12).fill(0),
    perempuan: Array(12).fill(0),
    lainnya: Array(12).fill(0),
    totalYear: 0,
  };

  const hasOtherGender = activeStats.lainnya.some((val) => val > 0);

  const series: ApexAxisChartSeries = useMemo(() => {
    const baseSeries: ApexAxisChartSeries = [
      {
        name: "Laki-laki",
        data: activeStats.laki,
      },
      {
        name: "Perempuan",
        data: activeStats.perempuan,
      },
    ];

    if (hasOtherGender) {
      baseSeries.push({
        name: "Lainnya",
        data: activeStats.lainnya,
      });
    }

    return baseSeries;
  }, [activeStats, hasOtherGender]);

  const totalLaki = activeStats.laki.reduce((acc, n) => acc + n, 0);
  const totalPerempuan = activeStats.perempuan.reduce((acc, n) => acc + n, 0);

  const chartOptions: ApexOptions = {
    chart: {
      toolbar: { show: false },
      type: "bar",
      fontFamily: "inherit",
      foreColor: "#7C8FAC",
      height: 310,
      stacked: true,
      width: "100%",
    },
    colors: hasOtherGender
      ? ["var(--color-primary)", "var(--color-secondary)", "#ffae1f"]
      : ["var(--color-primary)", "var(--color-secondary)"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "35%",
        borderRadius: 6,
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "all",
      },
    },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    grid: {
      borderColor: "rgba(0,0,0,0.1)",
      strokeDashArray: 3,
    },
    xaxis: {
      categories: MONTH_LABELS,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      decimalsInFloat: 0,
      labels: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val) => `${Math.round(val)} santri`,
      },
    },
  };

  return (
    <CardBox className="pb-2 h-full w-full">
      <div className="sm:flex items-center justify-between mb-6 gap-3">
        <div>
          <h5 className="card-title">Statistik Santri Bulanan</h5>
          <p className="text-sm text-muted-foreground font-normal">
            {loading
              ? "Memuat data berdasarkan created_at..."
              : `Tahun ${activeYear}: ${activeStats.totalYear} santri (Laki-laki: ${totalLaki} • Perempuan: ${totalPerempuan})`}
          </p>
        </div>

        <div className="sm:mt-0 mt-4">
          <Select
            value={activeYear}
            onValueChange={(val) => setSelectedYear(val)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              {groupedByYear.years.map((yr) => (
                <SelectItem key={yr} value={yr}>
                  Tahun {yr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {errorMsg ? (
        <div className="py-12 text-center text-sm text-error">{errorMsg}</div>
      ) : (
        <Chart
          options={chartOptions}
          series={series}
          type="bar"
          height={316}
          width="100%"
        />
      )}
    </CardBox>
  );
};

export default SalesOverview;