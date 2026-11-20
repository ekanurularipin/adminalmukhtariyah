'use client' // Ubah jadi client component agar bisa cek session & redirect langsung

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { DM_Sans } from 'next/font/google'
import './css/globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import ServiceWorkerRegister from '@/app/components/service-worker/ServiceWorkerRegister'
import { supabase } from '@/lib/supabase'

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
})

function hasGuruSession(): boolean {
  if (typeof window === 'undefined') return false
  const hasLocal = Boolean(localStorage.getItem('guru_session'))
  const hasCookie = document.cookie
    .split(';')
    .some((item) => item.trim() === 'guru_auth=1')
  return hasLocal || hasCookie
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      setIsChecking(true)

      const isGuru = hasGuruSession()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Jika sudah login sebagai guru dan membuka /auth/login, arahkan ke dashboard guru
      if (pathname.startsWith('/auth/login')) {
        if (isGuru && !session) {
          router.replace('/DashboardGuru/akun-guru/dashboard')
          return
        }
        setIsChecking(false)
        return
      }

      // Izinkan akses jika punya session Supabase Auth ATAU sesi guru aktif
      if (!session && !isGuru) {
        router.replace('/auth/login')
      } else {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  // Tampilkan layar kosong sebentar saat sistem sedang memeriksa sesi login
  if (isChecking && !pathname.startsWith('/auth/login')) {
    return (
      <html lang='en'>
        <body className={`${dmSans.className} h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900`}>
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-gray-500 font-medium">Memverifikasi Sesi Keamanan...</p>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link rel='icon' href='/' type='image/svg+xml' />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#5d87ff" />
      </head>
      <body className={`${dmSans.className}`}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange>
          <ServiceWorkerRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}