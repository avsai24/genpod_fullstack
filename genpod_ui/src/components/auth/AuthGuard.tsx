// src/components/auth/AuthGuard.tsx
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
    if (!session && pathname !== '/login') {
      router.push('/login')
    }
  }, [session, status, pathname])

  if (status === 'loading') {
    return <div className="text-center text-white">Loading...</div>
  }

  return <>{children}</>
}