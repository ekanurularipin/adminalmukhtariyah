'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import * as profileData from './data'
import SimpleBar from 'simplebar-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'

const Profile = () => {
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)

    try {
      // 1. Keluar dari sesi Supabase Auth (jika login sebagai admin)
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Gagal signOut Supabase:', err)
    } finally {
      // 2. Bersihkan sesi guru di localStorage & cookie
      if (typeof window !== 'undefined') {
        localStorage.removeItem('guru_session')
        document.cookie = 'guru_auth=; path=/; max-age=0; SameSite=Lax'

        // 3. Ganti URL riwayat saat ini ke /auth/login agar tombol Back tidak kembali ke dashboard
        window.location.replace('/auth/login')
      }
    }
  }

  return (
    <div className='relative group/menu ps-15 shrink-0'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span className='hover:text-primary hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:bg-lightprimary group-hover/menu:text-primary'>
            <Image
              src='/images/profile/user-1.jpg'
              alt='logo'
              height={35}
              width={35}
              className='rounded-full'
            />
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          className='w-screen sm:w-[200px] pb-4 pt-2 rounded-sm'>
          <SimpleBar>
            {profileData.profileDD.map((item, index) => (
              <DropdownMenuItem key={index} asChild>
                <Link
                  href={item.url}
                  className='px-4 py-2 flex justify-between items-center group/link w-full hover:bg-lightprimary hover:text-primary'>
                  <div className='flex items-center gap-3 w-full'>
                    <Icon
                      icon={item.icon}
                      className='text-lg text-muted-foreground group-hover/link:text-primary'
                    />
                    <h5 className='mb-0 text-sm text-muted-foreground group-hover/link:text-primary'>
                      {item.title}
                    </h5>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </SimpleBar>

          <DropdownMenuSeparator className='my-2' />

          <div className='px-4'>
            <Button
              type='button'
              variant='outline'
              className='w-full rounded-md'
              onClick={handleLogout}
              disabled={loggingOut}>
              {loggingOut ? 'Keluar...' : 'Logout'}
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default Profile