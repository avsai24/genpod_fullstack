'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return

    // 🚫 If not authenticated, redirect to login (but avoid loop)
    if (status === 'unauthenticated' && pathname !== '/login') {
      console.log('AuthGuard → Status:', status)
      console.log('AuthGuard → Session:', session)
      router.replace('/login')
      return
    }

    // ✅ Log authenticated user details
    if (status === 'authenticated') {
      console.log('🧠 Full Session in AuthGuard:', session)
      console.log('🧠 User info:', session?.user)
      if (!session?.user?.id || !session?.user?.provider) {
        console.warn('⚠️ Session is authenticated but missing user.id or provider')
      }
    }
  }, [status, pathname, session, router])

  if (status === 'loading') {
    return <div className="text-center text-white">Loading session...</div>
  }

  return <>{children}</>
}