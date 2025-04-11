'use client'

import { SessionProvider } from 'next-auth/react'
import AuthGuard from './auth'
import SplitLayout from '@/components/layouts/SplitLayout'
import LeftPanel from '@/components/LeftPanel'
import RightPanel from '@/components/RightPanel'

export default function Providers() {
  return (
    <SessionProvider>
      <AuthGuard>
        <SplitLayout left={<LeftPanel />} right={<RightPanel />} />
      </AuthGuard>
    </SessionProvider>
  )
}