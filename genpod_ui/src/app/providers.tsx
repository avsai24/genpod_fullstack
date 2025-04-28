'use client'

import { SessionProvider } from 'next-auth/react'
import AuthGuard from '../components/auth/AuthGuard'
import SplitLayout from '@/components/layouts/SplitLayout'
import LeftPanel from '@/components/LeftPanel/LeftPanel'
import RightPanel from '@/components/RightPanel/RightPanel'

export default function Providers() {
  return (
    <SessionProvider>
      <AuthGuard>
        <SplitLayout left={<LeftPanel />} right={<RightPanel />} />
      </AuthGuard>
    </SessionProvider>
  )
}