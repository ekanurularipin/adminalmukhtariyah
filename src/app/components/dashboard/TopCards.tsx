"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay } from "swiper/modules"
import "swiper/css"
import CardBox from "../shared/CardBox"
import { supabase } from "@/lib/supabase"

interface SantriMini {
  id: number | string
  jk?: string | null
  kobong_id?: number | string | null
  id_kobong?: number | string | null
  nama_kobong?: string | null
  kobong?: string | null
}

interface KobongMini {
  id: number | string
  nama_kobong?: string | null
  kapasitas_maksimal?: number | string | null
}

interface TopCardItem {
  key: string
  title: string
  desc: string
  img: string
  bgcolor: string
  textclr: string
  url: string
}

const isPutra = (jk?: string | null): boolean => {
  const v = String(jk || "").trim().toLowerCase()
  return v === "l" || v.startsWith("laki") || v.includes("putra") || v === "lk"
}

const isPutri = (jk?: string | null): boolean => {
  const v = String(jk || "").trim().toLowerCase()
  return v === "p" || v.startsWith("perempuan") || v.includes("putri") || v === "pr"
}

const TopCards = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const [santriRows, setSantriRows] = useState<SantriMini[]>([])
  const [kobongRows, setKobongRows] = useState<KobongMini[]>([])
  const [totalMapel, setTotalMapel] = useState<number>(0)
  const [totalMengaji, setTotalMengaji] = useState<number>(0)
  const [totalPiket, setTotalPiket] = useState<number>(0)

  useEffect(() => {
    let isMounted = true

    async function fetchTopCardStats() {
      setLoading(true)
      try {
        const [santriRes, kobongRes, mapelRes, mengajiRes, piketRes] = await Promise.all([
          supabase.from("santri").select("*"),
          supabase.from("kobong").select("id, nama_kobong, kapasitas_maksimal"),
          supabase.from("jadwal_pelajaran").select("id", { count: "exact", head: true }),
          supabase.from("jadwal_mengaji").select("id", { count: "exact", head: true }),
          supabase.from("jadwal_piket_patroli").select("id", { count: "exact", head: true }),
        ])

        if (!isMounted) return

        setSantriRows(!santriRes.error ? ((santriRes.data as SantriMini[]) || []) : [])
        setKobongRows(!kobongRes.error ? ((kobongRes.data as KobongMini[]) || []) : [])
        setTotalMapel(!mapelRes.error ? (mapelRes.count ?? 0) : 0)
        setTotalMengaji(!mengajiRes.error ? (mengajiRes.count ?? 0) : 0)
        setTotalPiket(!piketRes.error ? (piketRes.count ?? 0) : 0)
      } catch (err) {
        console.error("Gagal memuat statistik TopCards:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchTopCardStats()

    return () => {
      isMounted = false
    }
  }, [])

  const topCardInfo: TopCardItem[] = useMemo(() => {
    const totalSantri = santriRows.length
    const jumlahPutra = santriRows.filter((s) => isPutra(s.jk)).length
    const jumlahPutri = santriRows.filter((s) => isPutri(s.jk)).length

    const totalKobong = kobongRows.length
    const totalKapasitas = kobongRows.reduce(
      (sum, k) => sum + Math.max(Number(k.kapasitas_maksimal ?? 0) || 0, 0),
      0
    )
    const sisaSlotKobong = Math.max(totalKapasitas - totalSantri, 0)

    const val = (n: number) => (loading ? "..." : String(n))

    return [
      {
        key: "card-santri",
        title: "Total Santri",
        desc: val(totalSantri),
        img: "/images/svgs/icon-user-male.svg",
        bgcolor: "bg-primary/10 dark:bg-lightprimary",
        textclr: "text-primary dark:text-primary",
        url: "/santri",
      },
      {
        key: "card-putra",
        title: "Santri Putra",
        desc: val(jumlahPutra),
        img: "/images/svgs/icon-connect.svg",
        bgcolor: "bg-info/10 dark:bg-info/10",
        textclr: "text-info dark:text-info",
        url: "/santri",
      },
      {
        key: "card-putri",
        title: "Santri Putri",
        desc: val(jumlahPutri),
        img: "/images/svgs/icon-favorites.svg",
        bgcolor: "bg-error/10 dark:bg-error/10",
        textclr: "text-error dark:text-error",
        url: "/santri",
      },
      {
        key: "card-kobong",
        title: "Total Kobong",
        desc: val(totalKobong),
        img: "/images/svgs/icon-briefcase.svg",
        bgcolor: "bg-warning/10 dark:bg-warning/10",
        textclr: "text-warning dark:text-warning",
        url: "/kobong",
      },
      {
        key: "card-slot",
        title: "Sisa Slot Kobong",
        desc: val(sisaSlotKobong),
        img: "/images/svgs/icon-mailbox.svg",
        bgcolor: "bg-success/10 dark:bg-success/10",
        textclr: "text-success dark:text-success",
        url: "#product",
      },
      {
        key: "card-mapel",
        title: "Jadwal Pelajaran",
        desc: val(totalMapel),
        img: "/images/svgs/icon-speech-bubble.svg",
        bgcolor: "bg-secondary/10 dark:bg-secondary/10",
        textclr: "text-primary dark:text-primary",
        url: "/jadwal-pelajaran",
      },
      {
        key: "card-mengaji",
        title: "Jadwal Mengaji",
        desc: val(totalMengaji),
        img: "/images/svgs/icon-connect.svg",
        bgcolor: "bg-info/10 dark:bg-info/10",
        textclr: "text-info dark:text-info",
        url: "/jadwal-mengaji",
      },
      {
        key: "card-piket",
        title: "Piket & Patroli",
        desc: val(totalPiket),
        img: "/images/svgs/icon-briefcase.svg",
        bgcolor: "bg-warning/10 dark:bg-warning/10",
        textclr: "text-warning dark:text-warning",
        url: "/jadwal-piket-patroli",
      },
    ]
  }, [santriRows, kobongRows, totalMapel, totalMengaji, totalPiket, loading])

  return (
    <div>
      <Swiper
        slidesPerView={6}
        spaceBetween={24}
        loop={true}
        freeMode={true}
        grabCursor={true}
        speed={5000}
        autoplay={{
          delay: 0,
          disableOnInteraction: false,
        }}
        modules={[Autoplay]}
        breakpoints={{
          0: {
            slidesPerView: 1,
            spaceBetween: 10,
          },
          640: {
            slidesPerView: 2,
            spaceBetween: 14,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 18,
          },
          1030: {
            slidesPerView: 4,
            spaceBetween: 18,
          },
          1200: {
            slidesPerView: 6,
            spaceBetween: 24,
          },
        }}
        pagination={{
          clickable: true,
        }}
        className="mySwiper"
      >
        {topCardInfo.map((item) => (
          <SwiperSlide key={item.key}>
            <Link href={item.url}>
              <CardBox className={`shadow-none ${item.bgcolor} w-full border-none!`}>
                <div className="text-center hover:scale-105 transition-all ease-in-out">
                  <div className="flex justify-center">
                    <Image
                      src={item.img}
                      width="50"
                      height="50"
                      className="mb-3"
                      alt={item.title}
                    />
                  </div>
                  <p className={`font-semibold ${item.textclr} mb-1`}>
                    {item.title}
                  </p>
                  <h5 className={`text-lg font-semibold ${item.textclr} mb-0`}>
                    {item.desc}
                  </h5>
                </div>
              </CardBox>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export { TopCards }