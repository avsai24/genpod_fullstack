'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { app } from '@/lib/firebase'

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier
    confirmationResult: import('firebase/auth').ConfirmationResult
  }
}

export default function LoginPage() {
  const { data: session } = useSession()
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log('🧠 Current session:', session)
  }, [session])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const auth = getAuth(app)
      if (!window.recaptchaVerifier) {
        const recaptchaContainer = document.getElementById('recaptcha-container')
        if (!recaptchaContainer) return
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved')
          },
        })
      }
    } catch (err) {
      console.error('RecaptchaVerifier error:', err)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullPhone = `${countryCode}${phone}`.replace(/\s/g, '')
    const phoneRegex = /^\+\d{10,15}$/
    if (!phoneRegex.test(fullPhone)) {
      setError('Enter a valid phone number with country code')
      return
    }

    try {
      setLoading(true)
      const auth = getAuth(app)
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier)
      window.confirmationResult = confirmationResult
      sessionStorage.setItem('verificationId', confirmationResult.verificationId)
      sessionStorage.setItem('loginPhone', fullPhone)
      window.location.href = `/verify-otp?phone=${encodeURIComponent(fullPhone)}`
    } catch (err: any) {
      console.error('OTP sending failed:', err)
      setError('Failed to send OTP. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md bg-surface border border-border rounded-xl shadow-xl p-8"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image src="/logo/Capten_logo_full.svg" alt="Capten Logo" width={120} height={40} />
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">Welcome back</h2>
        <p className="text-sm text-text-secondary text-center mb-6">Login to your Engineering envm</p>

        {error && <div className="text-error text-sm mb-4 text-center">{error}</div>}

        {/* OTP Login Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-24 enterprise-input"
            >
              <option value="+1">🇺🇸 +1</option>
              <option value="+91">🇮🇳 +91</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+61">🇦🇺 +61</option>
              <option value="+81">🇯🇵 +81</option>
            </select>
            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                if (error) setError('')
              }}
              className="flex-1 enterprise-input"
            />
          </div>

          <button type="submit" className="enterprise-button w-full mt-1" disabled={loading}>
            {loading ? 'Sending OTP...' : 'Continue'}
          </button>
        </form>

        <p className="text-sm text-center text-text-secondary mt-5">
          Don’t have an account?{' '}
          <Link
            href="/signup"
            className="text-xs text-text-primary hover:text-accent-primary underline-offset-2 hover:underline transition"
          >
            Create one
          </Link>
        </p>

        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-border" />
          <span className="mx-2 text-text-secondary text-xs">OR</span>
          <div className="flex-grow h-px bg-border" />
        </div>

        {/* Social Logins */}
        <div className="space-y-2">
          {[
            { id: 'google', label: 'Google', icon: 'google.svg' },
            { id: 'azure-ad', label: 'Microsoft Account', icon: 'microsoft.svg' },
            { id: 'github', label: 'GitHub', icon: 'github.svg' },
            { id: 'gitlab', label: 'GitLab', icon: 'gitlab.svg' },
            { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin.svg' },
            { id: 'atlassian', label: 'Atlassian', icon: 'atlassian.svg' },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => signIn(id, { callbackUrl: '/' })}
              type="button"
              className="flex items-center gap-3 w-full text-sm font-medium text-white py-2.5 px-4 rounded-md border border-border bg-input hover:bg-surface-hover hover:scale-[1.01] hover:shadow-lg transition-all duration-150"
            >
              <Image src={`/icons/${icon}`} alt={label} width={18} height={18} />
              Continue with {label}
            </button>
          ))}
        </div>

        {/* reCAPTCHA element */}
        <div id="recaptcha-container" />

        {/* Footer */}
        <p className="text-center text-xs text-text-secondary mt-6">
          <Link href="#" className="hover:underline">Terms of Use</Link> |{' '}
          <Link href="#" className="hover:underline">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  )
}