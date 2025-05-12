'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from 'next-auth/react'

export default function PostSocialRedirect() {
  const router = useRouter()

  useEffect(() => {
    const registerSocialUser = async () => {
      const session = await getSession()
      if (!session?.user) {
        router.replace('/login?error=session_expired')
        return
      }

      const { name, email, provider } = session.user

      // ✅ Generate a safe username from name or email
      const username = name?.trim().toLowerCase().replace(/\s+/g, '_') || email?.split('@')[0]

      try {
        const res = await fetch('http://localhost:8000/api/users/register', {
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
              errorQuery = `provider_mismatch&message=${encodeURIComponent(data.message)}`
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
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen text-text-primary">
      <p>Processing your social login...</p>
    </div>
  )
}