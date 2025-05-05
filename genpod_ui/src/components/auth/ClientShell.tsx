'use client'

import SplitLayout from '@/components/layouts/SplitLayout'
import LeftPanel from '@/components/LeftPanel/LeftPanel'
import RightPanel from '@/components/RightPanel/RightPanel'
import AuthGuard from '@/components/auth/AuthGuard'

export default function ClientShell() {
  return (
    <AuthGuard>
      <div className="flex flex-col h-screen">
        <SplitLayout
          left={<LeftPanel />}
          right={<RightPanel />}
        />
      </div>
    </AuthGuard>
  )
}