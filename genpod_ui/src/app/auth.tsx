'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
        <motion.div
          className="text-4xl font-bold mb-4"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          🧠 Genpod
        </motion.div>
        <p className="text-sm text-gray-400">Checking authentication...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return <>{children}</>
}