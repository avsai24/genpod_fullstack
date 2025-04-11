// src/app/layout.server.tsx
import '@/styles/globals.css' // ✅ Correct path to your Tailwind/global CSS
import { ReactNode } from 'react'
import SessionWrapper from '@/components/auth/SessionWrapper'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  )
}