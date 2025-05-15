'use client'

import Sidebar from '@/components/sidebar/Sidebar'
import { ReactNode } from 'react'

export default function PromptLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-background text-text-primary">
      
      <div className="w-16 relative">
        <Sidebar />
      </div>

      
      <main className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}