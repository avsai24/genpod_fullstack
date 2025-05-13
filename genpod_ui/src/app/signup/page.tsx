'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
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

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const recaptchaContainerRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    countryCode: '+1',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'not_found') {
      setError('No account found. Please sign up first.')
    } else if (error === 'already_exists') {
      setError('Account already exists. Redirecting to login...')
      setTimeout(() => router.push('/login'), 2500)
    } else if (error === 'registration_failed') {
      setError('User registration failed. Please try again.')
    }
    if (error) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }, [searchParams, router])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    const setupRecaptcha = () => {
      if (typeof window === 'undefined' || window.recaptchaVerifier) return
      const auth = getAuth(app)
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => console.log('reCAPTCHA solved'),
          'expired-callback': () => setError('reCAPTCHA expired. Please try again.'),
        })
        window.recaptchaVerifier = verifier
      } catch (err) {
        console.error('reCAPTCHA setup failed:', err)
        setError('Failed to initialize security check.')
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
  }, [])

  const validateForm = () => {
    const { username, phone } = formData
    const fullPhone = `${formData.countryCode}${phone}`.replace(/\s/g, '')
    const usernameRegex = /^[a-z0-9_]{4,30}$/
    const phoneRegex = /^\+\d{10,15}$/
  
    if (!usernameRegex.test(username)) {
      setError('Username must be 4–30 characters. Use only lowercase letters, numbers, and underscores.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return false
    }
  
    if (!phoneRegex.test(fullPhone)) {
      setError('Enter a valid phone number with country code.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return false
    }
  
    return true
  }

  const handleSocialSignup = async (provider: string) => {
    Cookies.set('genpod-auth-intent', 'signup', { path: '/' })
    await signIn(provider, { callbackUrl: '/post-social-redirect' })
  }

  // inside SignupPage
const api = process.env.NEXT_PUBLIC_API_URL!

const handlePhoneSignup = async (e: React.FormEvent) => {
  e.preventDefault()
  // … your validation …

  const fullPhone = `${formData.countryCode}${formData.phone}`.replace(/\s/g, '')
  const trimmedUsername = formData.username.trim().toLowerCase()

  // ⬇️ POINT AT YOUR FASTAPI, not at Next.js
  const res = await fetch(`${api}/api/users/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: fullPhone, provider: 'firebase-otp' }),
  })

  const check = await res.json()
  console.log('[CHECK RESPONSE]', res.status, check)

  if (check.ok && check.provider === 'firebase-otp') {
    setError('Already registered – please log in.')
    return
  }
  if (!check.ok && res.status !== 404) {
    setError(check.message || 'Error checking phone.')
    return
  }

  // now send OTP
  const auth = getAuth(app)
  const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier!)
  window.confirmationResult = confirmationResult

  // stash for the next step
  Cookies.set('genpod-auth-intent', 'signup', { path: '/' })
  Cookies.set('genpod-signup-meta', JSON.stringify({
    username: trimmedUsername,
    phone: fullPhone,
    provider: 'firebase-otp',
  }), { path: '/' })
  sessionStorage.setItem('verificationId', confirmationResult.verificationId)

  router.push(`/verify-otp?phone=${encodeURIComponent(fullPhone)}`)
}
  
  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background text-text-primary">
      <div id="recaptcha-container" ref={recaptchaContainerRef} />
      <div className="absolute inset-0 z-0 animate-gradient" />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.form
          onSubmit={handlePhoneSignup}
          className={`w-full max-w-sm bg-surface border border-border rounded-xl shadow-xl p-8 ${shake ? 'animate-shake' : ''}`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-6">
            <Image src="/logo/Capten_logo_full.svg" alt="Capten Logo" width={120} height={40} />
          </div>

          <h2 className="text-2xl font-bold text-center mb-1">Create your account</h2>
          <p className="text-sm text-text-secondary text-center mb-5">Sign up using your phone number or social login</p>

          {error && (
            <div className="text-error text-sm mb-4 text-center bg-error/10 p-3 rounded-md">{error}</div>
          )}

          <input
            type="text"
            placeholder="Username *"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
            className="enterprise-input w-full mb-4"
            disabled={loading}
            required
          />

          <div className="flex mb-4 gap-2">
            <select
              aria-label="Country code"
              value={formData.countryCode}
              onChange={(e) => handleInputChange('countryCode', e.target.value)}
              className="w-24 enterprise-input"
              disabled={loading}
            >
              <option value="+1">🇺🇸 +1</option>
              <option value="+91">🇮🇳 +91</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+61">🇦🇺 +61</option>
              <option value="+81">🇯🇵 +81</option>
            </select>
            <input
              type="tel"
              placeholder="Phone number *"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="flex-1 enterprise-input"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="enterprise-button w-full" disabled={loading}>
            {loading ? 'Sending OTP...' : 'Continue with Phone'}
          </button>

          <p className="text-xs text-center text-text-secondary mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-xs text-text-primary hover:underline">Log in</Link>
          </p>

          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-border" />
            <span className="mx-2 text-text-secondary text-xs">OR</span>
            <div className="flex-grow h-px bg-border" />
          </div>

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
                onClick={() => handleSocialSignup(id)}
                type="button"
                disabled={loading}
                className="flex items-center gap-3 w-full text-sm font-medium text-white py-2.5 px-4 rounded-md border border-border bg-input hover:bg-surface-hover hover:scale-[1.01] hover:shadow-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Image src={`/icons/${icon}`} alt={label} width={18} height={18} />
                Sign up with {label}
              </button>
            ))}
          </div>
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