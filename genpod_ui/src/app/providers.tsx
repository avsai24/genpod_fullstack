'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import AuthGuard from '@/components/auth/AuthGuard'
import Sidebar from '@/components/sidebar/Sidebar'
import SplitLayout from '@/components/layouts/SplitLayout'
import LeftPanel from '@/components/LeftPanel/LeftPanel'
import RightPanel from '@/components/RightPanel/RightPanel'
import { useAgentStreamStore } from '@/state/agentStreamStore' 

export default function Providers() {
  const searchParams = useSearchParams()
  const startAgentStream = useAgentStreamStore((state) => state.startAgentStream)

  useEffect(() => {
    const prompt = searchParams.get('prompt')
    if (prompt) {
      console.log('🚀 Starting agent stream with prompt from URL:', prompt)
      startAgentStream(prompt)
    }
  }, [searchParams, startAgentStream])

  return (
    <SessionProvider>
      <AuthGuard>
        <div className="flex h-screen w-full">
          <Sidebar />
          <div className="flex-1">
            <SplitLayout left={<LeftPanel />} right={<RightPanel />} />
          </div>
        </div>
      </AuthGuard>
    </SessionProvider>
  )
}