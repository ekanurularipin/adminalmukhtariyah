'use client'

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { DM_Sans } from 'next/font/google'
import './css/globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import ServiceWorkerRegister from '@/app/components/service-worker/ServiceWorkerRegister'

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
})

const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
    let active = true

    const guardTimer = setTimeout(() => {
      if (active) setIsChecking(false)
    }, 2500)

    async function checkAuth() {
      if (!active) return
      setIsChecking(true)

      try {
        const isGuru = hasGuruSession()
        const {
          data: { session },
        } = await supabaseBrowser.auth.getSession()

        if (!active) return

        if (pathname.startsWith('/auth/login')) {
          if (isGuru && !session) {
            router.replace('/DashboardGuru/akun-guru/dashboard')
            return
          }
          setIsChecking(false)
          return
        }

        if (!session && !isGuru) {
          router.replace('/auth/login')
          return
        }

        setIsChecking(false)
      } catch {
        if (active) {
          setIsChecking(false)
        }
      } finally {
        clearTimeout(guardTimer)
      }
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      const isGuru = hasGuruSession()

      if (!pathname.startsWith('/auth/login') && !session && !isGuru) {
        router.replace('/auth/login')
      } else {
        setIsChecking(false)
      }
    })

    return () => {
      active = false
      clearTimeout(guardTimer)
      subscription.unsubscribe()
    }
  }, [pathname, router])

  const showSecurityCheck = isChecking && !pathname.startsWith('/auth/login')

  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link rel='icon' href='/' type='image/svg+xml' />
        <link rel='manifest' href='/manifest.json' />
        <meta name='theme-color' content='#5d87ff' />
      </head>
      <body className={`${dmSans.className}`}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange>
          <ServiceWorkerRegister />
          {showSecurityCheck ? (
            <div className='h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
              <div className='text-center space-y-2'>
                <div className='w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto' />
                <p className='text-xs text-gray-500 font-medium'>
                  Memverifikasi Sesi Keamanan...
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}