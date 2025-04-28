'use client'

import SplitLayout from '@/components/layouts/SplitLayout'
import LeftPanel from '@/components/LeftPanel/LeftPanel'
import RightPanel from '@/components/RightPanel/RightPanel'
import AuthGuard from '@/components/auth/AuthGuard'
import UserMenu from '@/components/auth/UserMenu'

export default function ClientShell() {
  return (
    <AuthGuard>
      <div className="flex flex-col h-screen">
        <div className="flex justify-end items-center px-4 py-2 bg-[#121212] border-b border-[#2a2a2a]">
          <UserMenu />
        </div>
        <SplitLayout
          left={<LeftPanel />}
          right={<RightPanel />}
        />
      </div>
    </AuthGuard>
  )
}