'use client'

import { useState, useEffect } from 'react'
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
    recaptchaVerifier: RecaptchaVerifier
    confirmationResult: import('firebase/auth').ConfirmationResult
  }
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({ phone: '', countryCode: '+1' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    const error = searchParams.get('error')
    const customMsg = searchParams.get('message')

    if (error) {
      if (error === 'not_found') {
        setError('No account found. Please sign up first.')
      } else if (error === 'already_exists') {
        setError('Account already exists. Please log in.')
      } else if (error === 'invalid_credentials') {
        setError('Invalid credentials. Please try again.')
      } else if (error === 'provider_mismatch' && customMsg) {
        setError(decodeURIComponent(customMsg))
      } else {
        setError('Something went wrong. Please try again.')
      }

      setShake(true)
      setTimeout(() => setShake(false), 2500)

      const cleanup = setTimeout(() => router.replace('/login'), 4000)
      return () => clearTimeout(cleanup)
    }
  }, [searchParams, router])

  useEffect(() => {
    const auth = getAuth(app)
    const setupRecaptcha = () => {
      if (typeof window === 'undefined' || window.recaptchaVerifier) return
      const container = document.getElementById('recaptcha-container')
      if (!container) return
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => console.log('reCAPTCHA solved'),
        })
      } catch (err) {
        console.error('reCAPTCHA setup failed:', err)
      }
    }

    const interval = setInterval(() => {
      if (document.getElementById('recaptcha-container')) {
        clearInterval(interval)
        setupRecaptcha()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const validateForm = () => {
    const fullPhone = `${formData.countryCode}${formData.phone}`.replace(/\s/g, '')
    const phoneRegex = /^\+\d{10,15}$/
    if (!phoneRegex.test(fullPhone)) {
      setError('Enter a valid phone number with country code')
      return false
    }
    return true
  }

  const handleSocialLogin = async (provider: string) => {
    try {
      setLoading(true)
      Cookies.set('genpod-auth-intent', 'login', { path: '/' })
      await signIn(provider, { callbackUrl: '/' })
    } catch (err) {
      console.error('Social login failed:', err)
      setError('Failed to log in. Please try again.')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      triggerShake()
      return
    }

    try {
      setLoading(true)
      const fullPhone = `${formData.countryCode}${formData.phone}`.replace(/\s/g, '')
      Cookies.set('genpod-auth-intent', 'login', { path: '/' })

      const checkRes = await fetch('http://localhost:8000/api/users/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, provider: 'firebase-otp' }),
      })

      if (checkRes.status === 404) {
        setError('No account found. Please sign up first.')
        triggerShake()
        return
      }

      if (![200, 409].includes(checkRes.status)) {
        throw new Error('Unexpected response from server')
      }

      const auth = getAuth(app)
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier)
      window.confirmationResult = confirmationResult

      sessionStorage.setItem('verificationId', confirmationResult.verificationId)
      router.push(`/verify-otp?phone=${encodeURIComponent(fullPhone)}`)
    } catch (err) {
      console.error('OTP error:', err)
      setError('Failed to send OTP. Please try again.')
      triggerShake()
    } finally {
      setLoading(false)
    }
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
      <div id="recaptcha-container" style={{ position: 'absolute', zIndex: -1 }} />
      <div className="absolute inset-0 z-0 animate-gradient" />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.form
          onSubmit={handleLogin}
          className={`w-full max-w-sm bg-surface border border-border rounded-xl shadow-xl p-8 ${shake ? 'animate-shake' : ''}`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-6">
            <Image src="/logo/Capten_logo_full.svg" alt="Capten Logo" width={120} height={40} />
          </div>

          <h2 className="text-2xl font-bold text-center mb-1">Welcome back</h2>
          <p className="text-sm text-text-secondary text-center mb-5">
            Log in using your phone number or social login
          </p>

          {error && (
            <div className="text-error text-sm mb-4 text-center bg-error/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex mb-4 gap-2">
            <select
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
              placeholder="Phone number"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="flex-1 enterprise-input"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="enterprise-button w-full" disabled={loading}>
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>

          <p className="text-xs text-center text-text-secondary mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-xs text-text-primary hover:underline">
              Sign up
            </Link>
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
                onClick={() => handleSocialLogin(id)}
                type="button"
                disabled={loading}
                className="flex items-center gap-3 w-full text-sm font-medium text-white py-2.5 px-4 rounded-md border border-border bg-input hover:bg-surface-hover hover:scale-[1.01] hover:shadow-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Image src={`/icons/${icon}`} alt={label} width={18} height={18} />
                Log in with {label}
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