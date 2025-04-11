'use client'

import { ReactNode } from 'react'
import AuthGuard from './auth'

export default function ClientWrapper({ children }: { children: ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}