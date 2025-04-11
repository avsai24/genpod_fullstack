// src/app/layout.tsx
import '../styles/globals.css'
import type { Metadata } from 'next'
import SessionWrapper from '@/components/auth/SessionWrapper'

export const metadata: Metadata = {
  title: 'Genpod UI',
  description: 'Frontend for Genpod',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionWrapper>
          {children}
        </SessionWrapper>
      </body>
    </html>
  )
}