'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Cookies from 'js-cookie'
import Image from 'next/image'

export default function PostSocialRedirect() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [error, setError] = useState('')

  useEffect(() => {
    if (status !== 'authenticated') return

    const registerSocialUser = async () => {
      try {
        // Read cookie safely in browser
        const signupMeta = Cookies.get('genpod-signup-meta')

        if (!signupMeta || !session?.user?.email) {
          console.error('Missing signup meta or session')
        router.push('/signup?error=meta_missing')
        return
      }

      const { firstName, lastName, provider } = JSON.parse(signupMeta)

        // Register new user
        const registerRes = await fetch('http://localhost:8000/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: session.user.email,
            first_name: firstName,
            last_name: lastName,
            provider,
          }),
        })

        const result = await registerRes.json()

        if (result.ok) {
          // Clean up
          Cookies.remove('genpod-signup-meta')
          Cookies.remove('genpod-auth-intent')
          router.push('/')
        } else {
          console.error('Registration failed:', result.message)
          router.push('/signup?error=registration_failed')
        }
      } catch (err: unknown) {
        console.error('Registration error:', err)
        setError('An error occurred during registration. Please try again.')
        setTimeout(() => router.push('/signup?error=network_error'), 2000)
      }
    }

    registerSocialUser()
  }, [session, status, router])

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <div className="w-full max-w-sm bg-surface p-8 rounded-xl shadow-lg border border-border text-center">
        <div className="flex justify-center mb-6">
          <Image src="/logo/Capten_logo_full.svg" alt="Capten Logo" width={120} height={40} />
        </div>

        {error ? (
          <div className="text-error text-sm mb-4 text-center bg-error/10 p-3 rounded-md">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-text-secondary">Setting up your account...</p>
          </div>
        )}
      </div>
    </div>
  )
}