'use client'

import { SessionProvider } from 'next-auth/react'
import AuthGuard from '@/components/auth/AuthGuard'
import Sidebar from '@/components/layouts/Sidebar'
import SplitLayout from '@/components/layouts/SplitLayout'
import LeftPanel from '@/components/LeftPanel/LeftPanel'
import RightPanel from '@/components/RightPanel/RightPanel'

export default function Providers() {
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