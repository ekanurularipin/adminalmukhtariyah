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

interface JadwalPiketPatroliRow {
  id: string
  hari: string | null
  shift_malam: string | null
  regu: string | null
  ustadz_pembina: string | null
  posjaga_jalur: string | null
  created_at?: string | null
  updated_at?: string | null
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
}

const BADGE_VARIANTS = [
  'bg-primary text-white',
  'bg-secondary text-white',
  'bg-success text-white',
  'bg-warning text-white',
]

export const JadwalPiketPatroliPage = () => {
  const [jadwalList, setJadwalList] = useState<JadwalPiketPatroliRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    let isMounted = true

    async function fetchJadwalPiketPatroli() {
      setLoading(true)
      setErrorMsg('')

      try {
        const { data, error } = await supabase
          .from('jadwal_piket_patroli')
          .select(
            'id, hari, shift_malam, regu, ustadz_pembina, posjaga_jalur, created_at, updated_at'
          )
          .order('created_at', { ascending: true })

        if (error) throw error

        if (isMounted) {
          setJadwalList((data as JadwalPiketPatroliRow[]) || [])
        }
      } catch (err: unknown) {
        console.error('Gagal memuat tabel jadwal_piket_patroli:', err)
        if (isMounted) {
          setErrorMsg('Gagal memuat data dari tabel jadwal_piket_patroli.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchJadwalPiketPatroli()

    return () => {
      isMounted = false
    }
  }, [])

  const sortedData = useMemo(() => {
    return [...jadwalList].sort((a, b) => {
      const hariA = URUTAN_HARI[String(a.hari || '').trim().toLowerCase()] ?? 99
      const hariB = URUTAN_HARI[String(b.hari || '').trim().toLowerCase()] ?? 99
      if (hariA !== hariB) return hariA - hariB

      return String(a.shift_malam || '').localeCompare(String(b.shift_malam || ''))
    })
  }, [jadwalList])

  return (
    <CardBox className='w-full'>
      <div id='jadwal-piket-patroli' className='mb-6'>
        <div>
          <h5 className='card-title'>Jadwal Piket &amp; Patroli</h5>
          <p className='text-sm text-muted-foreground font-normal'>
            Daftar regu piket malam, pembina, dan titik pos jaga / jalur patroli
          </p>
        </div>
      </div>

      <div className='w-full overflow-x-auto'>
        <Table className='w-full'>
          <TableHeader>
            <TableRow>
              <TableHead className='text-sm font-semibold w-14'>No</TableHead>
              <TableHead className='text-sm font-semibold'>
                Hari &amp; Shift
              </TableHead>
              <TableHead className='text-sm font-semibold'>
                Regu &amp; Pembina
              </TableHead>
              <TableHead className='text-sm font-semibold'>
                Pos Jaga / Jalur
              </TableHead>
              <TableHead className='text-sm font-semibold'>
                Shift Malam
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-6 text-muted-foreground'>
                  Memuat data jadwal piket &amp; patroli...
                </TableCell>
              </TableRow>
            ) : errorMsg ? (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-6 text-error'>
                  {errorMsg}
                </TableCell>
              </TableRow>
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-6 text-muted-foreground'>
                  Belum ada data pada tabel jadwal_piket_patroli.
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item, index) => {
                const badgeClass =
                  BADGE_VARIANTS[index % BADGE_VARIANTS.length]

                return (
                  <TableRow key={item.id} className='border-b border-border'>
                    <TableCell>
                      <p className='text-muted-foreground font-medium text-sm'>
                        {index + 1}
                      </p>
                    </TableCell>

                    <TableCell className='min-w-40'>
                      <div>
                        <h6 className='text-sm font-semibold mb-0.5 capitalize'>
                          {item.hari || '-'}
                        </h6>
                        <p className='text-xs text-muted-foreground'>
                          {item.shift_malam || '-'}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className='min-w-45'>
                      <div>
                        <h6 className='text-sm font-semibold mb-0.5 capitalize'>
                          {item.regu || '-'}
                        </h6>
                        <p className='text-xs text-muted-foreground'>
                          Pembina: {item.ustadz_pembina || '-'}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <p className='font-medium text-muted-foreground text-sm capitalize'>
                        {item.posjaga_jalur || '-'}
                      </p>
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={`text-[13px] px-3 rounded-full justify-center py-0.5 whitespace-nowrap ${badgeClass}`}>
                        {item.shift_malam || 'Malam'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </CardBox>
  )
}

export default JadwalPiketPatroliPage