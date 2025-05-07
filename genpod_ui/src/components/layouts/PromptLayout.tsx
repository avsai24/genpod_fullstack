'use client'

import Sidebar from '@/components/layouts/Sidebar'
import { ReactNode } from 'react'

export default function PromptLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-background text-text-primary">
      {/* ✅ Fixed-width container to prevent content shifting */}
      <div className="w-16 relative">
        <Sidebar />
      </div>

      {/* ✅ Main content remains fixed */}
      <main className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}