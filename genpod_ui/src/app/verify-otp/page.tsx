// app/verify-otp/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { signIn } from 'next-auth/react'
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth'
import { app } from '@/lib/firebase'
import Cookies from 'js-cookie'

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier
    confirmationResult: import('firebase/auth').ConfirmationResult
  }
}

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const recaptchaRef = useRef<HTMLDivElement>(null)

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [phone, setPhone] = useState('')

  //  📡 make sure you have this in .env.local:
  // NEXT_PUBLIC_API_URL=http://localhost:8000
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  // 1️⃣ grab the verificationId & phone, init invisible reCAPTCHA
  useEffect(() => {
    const vid = sessionStorage.getItem('verificationId')
    const p = searchParams.get('phone')
    if (!vid || !p) {
      router.replace('/login')
      return
    }
    setPhone(p)

    const auth = getAuth(app)
    if (!window.recaptchaVerifier && recaptchaRef.current) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => console.log('✔️ reCAPTCHA solved'),
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.')
        },
      })
    }

    return () => {
      window.recaptchaVerifier?.clear()
    }
  }, [router, searchParams])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const validateOtp = (v: string) => /^\d{6}$/.test(v)

  // 2️⃣ Verify OTP → check/register → NextAuth signIn → full reload
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateOtp(otp)) {
      setError('Enter a valid 6-digit code')
      return triggerShake()
    }

    setLoading(true)
    setError('')

    try {
      // 🔐 confirm with Firebase
      const cred = await window.confirmationResult.confirm(otp)
      const user = cred.user

      const intent = Cookies.get('genpod-auth-intent')    // "signup" or "login"
      const signupMeta = Cookies.get('genpod-signup-meta') // only on signup

      // ─── STEP 1: CHECK (and REGISTER if 404 + signup) ───────────────
      const checkUrl = `${API_URL}/api/users/check`
      console.log('POST →', checkUrl)
      const checkRes = await fetch(checkUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, provider: 'firebase-otp' }),
      })

      if (checkRes.status === 404) {
        // new user: register
        if (intent === 'signup' && signupMeta) {
          const { username } = JSON.parse(signupMeta)
          const regRes = await fetch(`${API_URL}/api/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, phone, provider: 'firebase-otp' }),
          })
          if (!regRes.ok) {
            const txt = await regRes.text()
            throw new Error('Registration failed: ' + txt)
          }
        } else {
          throw new Error('No account found. Please sign up first.')
        }
      }

      // ─── STEP 2: NextAuth signIn (JWT, no redirect) ───────────────
      const idToken = await user.getIdToken()
      const callbackUrl = window.location.origin
      console.log('Using callbackUrl:', callbackUrl)
      const result = await signIn('firebase-otp', {
        token: idToken,
        redirect: false,
        callbackUrl,
      })
      if (result?.error) throw new Error(result.error)

      // ─── CLEANUP ──────────────────────────────────────────────
      sessionStorage.removeItem('verificationId')
      Cookies.remove('genpod-auth-intent')
      Cookies.remove('genpod-signup-meta')

      // ─── FULL RELOAD so the auth cookie gets read ───────────────
      window.location.href = result.url ?? callbackUrl
    } catch (err: any) {
      console.error('Verification failed:', err)
      setError(err.message || 'OTP verification failed')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  // 3️⃣ “Resend code” button
  const handleResend = async () => {
    try {
      setLoading(true)
      setError('')
      const auth = getAuth(app)
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phone,
        window.recaptchaVerifier!
      )
      window.confirmationResult = confirmationResult
      sessionStorage.setItem('verificationId', confirmationResult.verificationId)
      setError('New OTP sent!')
    } catch (err) {
      console.error('Resend failed:', err)
      setError('Failed to resend. Try again.')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background text-text-primary">
      <div id="recaptcha-container" ref={recaptchaRef} />
      <div className="absolute inset-0 z-0 animate-gradient" />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.form
          onSubmit={handleVerify}
          className={`w-full max-w-sm bg-surface border border-border rounded-xl shadow-xl p-8 ${
            shake ? 'animate-shake' : ''
          }`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* — your logo, copy, error box, input + buttons here — */}
          <div className="flex justify-center mb-6">
            <Image
              src="/logo/Capten_logo_full.svg"
              alt="Capten Logo"
              width={120}
              height={40}
            />
          </div>
          <h2 className="text-2xl font-bold text-center mb-1">
            Verify your phone
          </h2>
          <p className="text-sm text-text-secondary text-center mb-5">
            Enter the 6-digit code sent to {phone}
          </p>

          {error && (
            <div className="text-error text-sm mb-4 text-center bg-error/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="enterprise-input w-full mb-4 text-center text-2xl tracking-widest"
            disabled={loading}
            maxLength={6}
            required
          />

          <button type="submit" className="enterprise-button w-full" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify OTP'}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="w-full mt-4 text-sm text-text-secondary hover:text-text-primary"
          >
            Didn’t receive the code? Resend
          </button>
        </motion.form>
      </div>

      <style jsx>{`
        .animate-shake {
          animation: shake 0.3s ease;
        }
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}