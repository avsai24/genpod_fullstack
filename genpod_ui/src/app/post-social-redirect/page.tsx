'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from 'next-auth/react'

export default function PostSocialRedirect() {
  const router = useRouter()
  const api = process.env.NEXT_PUBLIC_API_URL!

  useEffect(() => {
    const registerSocialUser = async () => {
      const session = await getSession()

      if (!session?.user) {
        router.replace('/login?error=session_expired')
        return
      }

      const { name, email, provider } = session.user

      // ✅ Generate a normalized username
      const username = name?.trim().toLowerCase().replace(/\s+/g, '_') || email?.split('@')[0] || 'user'

      try {
        const res = await fetch(`${api}/api/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            username,
            provider,
          }),
        })

        if (!res.ok) {
          let errorQuery = 'registration_failed'
          try {
            const data = await res.json()
            if (res.status === 409 && data?.message) {
              if (data.message.toLowerCase().includes('originally registered using')) {
                errorQuery = `provider_mismatch&message=${encodeURIComponent(data.message)}`
              } else if (data.message.toLowerCase().includes('already registered')) {
                errorQuery = 'already_exists'
              } else {
                errorQuery = 'registration_failed'
              }
            }
          } catch {
            const fallback = await res.text()
            console.error('⚠️ Registration failed:', fallback)
          }

          router.replace(`/login?error=${errorQuery}`)
          return
        }

        router.replace('/')
      } catch (err) {
        console.error('❌ Registration error:', err)
        router.replace('/login?error=network_error')
      }
    }

    registerSocialUser()
  }, [router, api])

  return (
    <div className="flex items-center justify-center h-screen text-text-primary">
      <p className="text-sm animate-pulse">Hang tight... finalizing your account ⏳</p>
    </div>
  )
}