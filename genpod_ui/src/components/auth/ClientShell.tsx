'use client'

import { useEffect } from 'react'
import SplitLayout from '@/components/layouts/SplitLayout'
import LeftPanel from '@/components/LeftPanel'
import RightPanel from '@/components/RightPanel'
import AuthGuard from '@/app/auth'
import UserMenu from '@/components/auth/UserMenu'
import { startLogStream } from '@/state/logStream' // ✅ Import the log stream starter

export default function ClientShell() {
  useEffect(() => {
    startLogStream() // ✅ Starts log stream globally
  }, [])

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen">
        <div className="flex justify-end items-center px-4 py-2 bg-[#121212] border-b border-[#2a2a2a]">
          <UserMenu />
        </div>
        <SplitLayout left={<LeftPanel />} right={<RightPanel />} />
      </div>
    </AuthGuard>
  )
}