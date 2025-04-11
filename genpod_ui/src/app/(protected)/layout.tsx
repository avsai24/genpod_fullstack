'use client'

import AuthGuard from '../auth'
import SplitLayout from '@/components/layouts/SplitLayout'
import LeftPanel from '@/components/LeftPanel'
import RightPanel from '@/components/RightPanel'
import UserMenu from '@/components/auth/UserMenu'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex justify-between items-center px-6 py-3 border-b border-[#2a2a2a] bg-[#0a0a0a] text-white">
        <div className="text-lg font-semibold">Genpod</div>
        <UserMenu />
      </div>
      <SplitLayout left={<LeftPanel />} right={<RightPanel />} />
    </AuthGuard>
  )
}