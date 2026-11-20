'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import LoginLogo from '@/app/(DashboardLayout)/layout/shared/logo/loginlogo'
import CardBox from '../shared/CardBox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const Login = () => {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Cek apakah email ada di tabel guru_mts
      const { data: guruData, error: guruErr } = await supabase
        .from('guru_mts')
        .select('*')
        .eq('email', email.trim())
        .maybeSingle()

      if (guruErr) {
        throw guruErr
      }

      if (guruData) {
        if (guruData.password === password) {
          localStorage.setItem('guru_session', JSON.stringify(guruData))
          document.cookie = 'guru_auth=1; path=/; max-age=86400; SameSite=Lax'
          window.location.assign('/DashboardGuru/akun-guru/dashboard')
          return
        } else {
          throw new Error('Email atau password salah.')
        }
      }

      // 2. Jika bukan guru, login sebagai Admin via Supabase Auth (cookie-based SSR client)
      const { data, error: authError } = await supabaseBrowser.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) throw authError

      if (data.session) {
        window.location.assign('/')
        return
      }

      throw new Error('Sesi login tidak ditemukan.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat login.'
      setError(message === 'Invalid login credentials' ? 'Email atau password salah.' : message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-full flex justify-center items-center bg-lightprimary px-4">
      <div className="w-full max-w-[450px]">
        <CardBox>
          <div className="flex justify-center">
            <LoginLogo />
          </div>

          <h1 className="text-center">
            Assalamualaikum
          </h1>

          <form onSubmit={handleLogin}>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="email" className="font-medium">
                  Email
                </Label>
              </div>

              <Input
                id="email"
                type="email"
                placeholder="Masukkan email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mt-6">
              <div className="mb-2 block">
                <Label htmlFor="password" className="font-medium">
                  Password
                </Label>
              </div>

              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">
                  {error}
                </p>
              </div>
            )}

            <div className="flex justify-end my-6">
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="text-sm font-medium text-primary hover:underline"
              >
                Lupa Password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Sign In'}
            </Button>
          </form>
        </CardBox>
      </div>
    </div>
  )
}