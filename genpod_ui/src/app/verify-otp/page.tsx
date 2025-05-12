'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { signIn } from 'next-auth/react'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
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
  const recaptchaContainerRef = useRef<HTMLDivElement>(null)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [phone, setPhone] = useState('')

  useEffect(() => {
    const storedVerificationId = sessionStorage.getItem('verificationId')
    const phoneParam = searchParams.get('phone')

    if (!storedVerificationId || !phoneParam) {
      router.push('/login')
      return
    }

    setPhone(phoneParam)

    let interval: NodeJS.Timeout | null = null

    const setupRecaptcha = () => {
      if (typeof window === 'undefined' || window.recaptchaVerifier) return
      const auth = getAuth(app)
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => console.log('reCAPTCHA solved'),
          'expired-callback': () => setError('reCAPTCHA expired. Please try again.')
        })
        window.recaptchaVerifier = verifier
      } catch (err) {
        console.error('reCAPTCHA setup failed:', err)
        setError('Failed to initialize security check. Please refresh the page.')
      }
    }

    interval = setInterval(() => {
      setupRecaptcha()
      if (window.recaptchaVerifier && interval) clearInterval(interval)
    }, 100)

    return () => {
      if (interval) clearInterval(interval)
      window.recaptchaVerifier?.clear()
      delete window.recaptchaVerifier
    }
  }, [router, searchParams])

  const validateOtp = (otp: string) => {
    if (!otp || !/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP')
      return false
    }
    return true
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateOtp(otp)) {
      triggerShake()
      return
    }

    try {
      setLoading(true)
      setError('')

      const credential = await window.confirmationResult.confirm(otp)
      const user = credential.user

      const intent = Cookies.get('genpod-auth-intent') // 'signup' or 'login'
      const signupMeta = Cookies.get('genpod-signup-meta')
      const checkRes = await fetch('http://localhost:8000/api/users/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, provider: 'firebase-otp' }),
      })

      if (checkRes.status === 404) {
        if (intent === 'signup' && signupMeta) {
          let meta
          try {
            meta = JSON.parse(signupMeta)
          } catch (err) {
            console.error('Invalid signupMeta:', signupMeta)
            setError('Signup session expired. Please try again.')
            return
          }

          const registerRes = await fetch('http://localhost:8000/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: meta.username,
              phone,
              provider: 'firebase-otp',
              firebaseUid: user.uid,
            }),
          })

          if (!registerRes.ok) {
            const errText = await registerRes.text()
            throw new Error('Registration failed: ' + errText)
          }
        } else {
          throw new Error('No account found. Please sign up first.')
        }
      }

      const idToken = await user.getIdToken()

      const result = await signIn('firebase-otp', {
        token: idToken,
        redirect: false,
        callbackUrl: typeof window !== 'undefined' ? `${window.location.origin}/` : '/',
      })

      if (result?.error) throw new Error(result.error)

      // ✅ Clean up
      sessionStorage.removeItem('verificationId')
      Cookies.remove('genpod-signup-meta')
      Cookies.remove('genpod-auth-intent')

      router.push('/')
    } catch (err) {
      console.error('Verification failed:', err)
      setError(err instanceof Error ? err.message : 'OTP verification failed. Try again.')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      setLoading(true)
      setError('')
      const auth = getAuth(app)
      const confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier!)
      window.confirmationResult = confirmationResult
      sessionStorage.setItem('verificationId', confirmationResult.verificationId)
      setError('New OTP sent successfully!')
    } catch (err) {
      console.error('Resend failed:', err)
      setError('Failed to resend OTP. Please try again.')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background text-text-primary">
      <div id="recaptcha-container" ref={recaptchaContainerRef} />
      <div className="absolute inset-0 z-0 animate-gradient" />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.form
          onSubmit={handleVerify}
          className={`w-full max-w-sm bg-surface border border-border rounded-xl shadow-xl p-8 ${shake ? 'animate-shake' : ''}`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-6">
            <Image src="/logo/Capten_logo_full.svg" alt="Capten Logo" width={120} height={40} />
          </div>

          <h2 className="text-2xl font-bold text-center mb-1">Verify your phone</h2>
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
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="enterprise-input w-full mb-4 text-center text-2xl tracking-widest"
            disabled={loading}
            maxLength={6}
            required
          />

          <button type="submit" className="enterprise-button w-full" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="w-full mt-4 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Didn&apos;t receive the code? Resend
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