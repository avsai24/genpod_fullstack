'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { getAuth, PhoneAuthProvider, signInWithCredential } from 'firebase/auth'
import { signIn } from 'next-auth/react'
import { app } from '@/lib/firebase'

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone') || ''

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationId, setVerificationId] = useState<string | null>(null)

  // ⏳ Get verificationId from sessionStorage or window.confirmationResult
  useEffect(() => {
    const storedId = sessionStorage.getItem('verificationId')
    const fromWindow =
      typeof window !== 'undefined' && window.confirmationResult?.verificationId

    if (fromWindow) {
      sessionStorage.setItem('verificationId', fromWindow)
      setVerificationId(fromWindow)
    } else if (storedId) {
      setVerificationId(storedId)
    } else {
      setError('OTP session expired. Please go back and re-enter your phone number.')
      setTimeout(() => router.push('/signup'), 2000)
    }
  }, [router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    if (!verificationId) {
      setError('Session expired. Please try again.')
      return
    }

    try {
      setLoading(true)
      const auth = getAuth(app)

      // ✅ Step 1: Firebase verify OTP
      const credential = PhoneAuthProvider.credential(verificationId, otp)
      const result = await signInWithCredential(auth, credential)

      console.log('✅ Firebase user:', result.user)

      // ✅ Step 2: Get Firebase ID token
      const idToken = await result.user.getIdToken()

      // ✅ Step 3: Sign in with NextAuth using Firebase token
      const res = await signIn('firebase-otp', {
        token: idToken,
        callbackUrl: '/',
        redirect: true,
      })

      console.log('🔐 NextAuth result:', res)
      sessionStorage.removeItem('verificationId')
    } catch (err) {
      console.error('OTP verification failed:', err)
      setError('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background text-text-primary">
      <div className="w-full max-w-sm bg-surface p-8 rounded-xl shadow-lg border border-border">
        <div className="flex justify-center mb-6">
          <Image src="/logo/Capten_logo_full.svg" alt="Capten Logo" width={120} height={40} />
        </div>

        <h2 className="text-xl font-semibold text-center mb-1">Verify OTP</h2>
        <p className="text-sm text-center text-text-secondary mb-4">
          Enter the 6-digit code sent to <strong>{phone}</strong>
        </p>

        {error && <div className="text-error text-sm mb-4 text-center">{error}</div>}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value)
              if (error) setError('')
            }}
            placeholder="Enter 6-digit OTP"
            className="enterprise-input w-full text-center tracking-widest text-lg"
          />

          <button type="submit" className="enterprise-button w-full" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  )
}