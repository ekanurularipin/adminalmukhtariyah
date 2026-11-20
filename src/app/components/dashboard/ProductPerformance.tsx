'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import CardBox from '../shared/CardBox'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

interface KobongRow {
  id: number
  nama_kobong: string
  created_at?: string | null
  kapasitas_maksimal: number | null
  pembina?: string | null
  jenis_kelamin?: string | null
}

interface SantriRow {
  id: number | string
  kobong_id?: number | string | null
  id_kobong?: number | string | null
  nama_kobong?: string | null
  kobong?: string | null
}

type PriorityLevel = 'Low' | 'Medium' | 'High'

interface KobongPerformanceItem {
  key: string
  namaKobong: string
  jenisKelamin: string
  kapasitasMaksimal: number
  isiKobong: number
  sisaKosong: number
  keterangan: string
  priority: PriorityLevel
  badgeClass: string
}

const getPriorityMeta = (
  sisaKosong: number
): { priority: PriorityLevel; badgeClass: string } => {
  if (sisaKosong <= 0) {
    return {
      priority: 'High',
      badgeClass: 'bg-error text-white',
    }
  }
  if (sisaKosong <= 5) {
    return {
      priority: 'Medium',
      badgeClass: 'bg-secondary text-white',
    }
  }
  return {
    priority: 'Low',
    badgeClass: 'bg-primary text-white',
  }
}

export const ProductPerformance = () => {
  const [kobongList, setKobongList] = useState<KobongRow[]>([])
  const [santriList, setSantriList] = useState<SantriRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      setLoading(true)
      setErrorMsg('')

      try {
        const [kobongRes, santriRes] = await Promise.all([
          supabase
            .from('kobong')
            .select('id, nama_kobong, created_at, kapasitas_maksimal, pembina, jenis_kelamin')
            .order('id', { ascending: true }),
          supabase.from('santri').select('*'),
        ])

        if (kobongRes.error) throw kobongRes.error
        if (santriRes.error) throw santriRes.error

        if (isMounted) {
          setKobongList((kobongRes.data as KobongRow[]) || [])
          setSantriList((santriRes.data as SantriRow[]) || [])
        }
      } catch (err: unknown) {
        console.error('Gagal memuat data kobong & santri:', err)
        if (isMounted) {
          setErrorMsg('Gagal memuat data dari tabel kobong atau santri.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  const performersData: KobongPerformanceItem[] = useMemo(() => {
    return kobongList.map((kobong) => {
      const namaKobong = String(kobong.nama_kobong || `Kobong ${kobong.id}`).trim()
      const kapasitasMaksimal = Math.max(Number(kobong.kapasitas_maksimal ?? 0) || 0, 0)
      const jenisKelamin = String(kobong.jenis_kelamin || '-').trim()

      // Hitung jumlah santri yang menempati kobong ini
      const isiKobong = santriList.filter((santri) => {
        const refId = santri.kobong_id ?? santri.id_kobong
        if (refId !== undefined && refId !== null && String(refId).trim() !== '') {
          if (String(refId).trim() === String(kobong.id)) return true
        }

        const refNama = String(santri.nama_kobong ?? santri.kobong ?? '')
          .trim()
          .toLowerCase()
        if (refNama && refNama === namaKobong.toLowerCase()) {
          return true
        }

        return false
      }).length

      // Keterangan: kapasitas_maksimal dikurangi isi kobong dari tabel santri
      const sisaKosong = Math.max(kapasitasMaksimal - isiKobong, 0)
      const keterangan =
        kapasitasMaksimal > 0 && isiKobong >= kapasitasMaksimal
          ? `Penuh / Kosong 0 (Isi ${isiKobong}/${kapasitasMaksimal})`
          : `Kosong ${sisaKosong} (Isi ${isiKobong}/${kapasitasMaksimal})`

      const { priority, badgeClass } = getPriorityMeta(sisaKosong)

      return {
        key: String(kobong.id),
        namaKobong,
        jenisKelamin,
        kapasitasMaksimal,
        isiKobong,
        sisaKosong,
        keterangan,
        priority,
        badgeClass,
      }
    })
  }, [kobongList, santriList])

  return (
    <CardBox>
      <div id='product' className='mb-6'>
        <div>
          <h5 className='card-title'>Kapasitas &amp; Ketersediaan Kobong</h5>
          <p className='text-sm text-muted-foreground font-normal'>
            Data kapasitas dari tabel kobong &amp; jumlah penghuni dari tabel santri
          </p>
        </div>
      </div>

      <div className='flex flex-col'>
        <div className='-m-1.5 overflow-x-auto'>
          <div className='p-1.5 min-w-full inline-block align-middle'>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='text-sm font-semibold'>No</TableHead>
                    <TableHead className='text-sm font-semibold'>
                      Nama Kobong
                    </TableHead>
                    <TableHead className='text-sm font-semibold'>
                      Kapasitas
                    </TableHead>
                    <TableHead className='text-sm font-semibold'>
                      Keterangan
                    </TableHead>
                    <TableHead className='text-sm font-semibold'>
                      Priority
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center py-6 text-muted-foreground'>
                        Memuat data kobong &amp; santri...
                      </TableCell>
                    </TableRow>
                  ) : errorMsg ? (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center py-6 text-error'>
                        {errorMsg}
                      </TableCell>
                    </TableRow>
                  ) : performersData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center py-6 text-muted-foreground'>
                        Belum ada data pada tabel kobong.
                      </TableCell>
                    </TableRow>
                  ) : (
                    performersData.map((item, index) => (
                      <TableRow key={item.key} className='border-b border-border'>
                        <TableCell>
                          <p className='text-muted-foreground font-medium text-sm'>
                            {index + 1}
                          </p>
                        </TableCell>

                        <TableCell className='min-w-[180px]'>
                          <div>
                            <h6 className='text-sm font-semibold mb-0.5 capitalize'>
                              {item.namaKobong}
                            </h6>
                            <p className='text-xs text-muted-foreground capitalize'>
                              {item.jenisKelamin}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <p className='font-medium text-sm'>
                            {item.kapasitasMaksimal}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className='font-medium text-muted-foreground text-sm'>
                            {item.keterangan}
                          </p>
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={`text-[13px] px-3 rounded-full justify-center py-0.5 ${item.badgeClass}`}>
                            {item.priority}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </CardBox>
  )
}