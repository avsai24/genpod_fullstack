'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (session) {
      // ✅ This will log for BOTH username and Google login
      console.log('🧠 Session in AuthGuard:', session)
    }

    if (status === 'loading') return
    if (!session && pathname !== '/login') {
      router.push('/login')
    }
  }, [session, status, pathname])

  if (status === 'loading') {
    return <div className="text-center text-white">Loading...</div>
  }

  return <>{children}</>
}