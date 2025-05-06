import { Geist, Geist_Mono } from 'next/font/google'
import '@/styles/globals.css'
import SessionWrapper from '@/components/auth/SessionWrapper'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-sans font-mono`}>
      <SessionWrapper>{children}</SessionWrapper>
    </div>
  )
}