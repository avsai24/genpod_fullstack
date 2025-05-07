'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { app } from '@/lib/firebase'

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier
    confirmationResult: import('firebase/auth').ConfirmationResult
  }
}

export default function SignupPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const shakeForm = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  // ✅ Delay recaptcha setup until DOM is ready and container exists
  useEffect(() => {
    const auth = getAuth(app)

    const setupRecaptcha = () => {
      if (typeof window === 'undefined' || window.recaptchaVerifier) return

      const container = document.getElementById('recaptcha-container')
      if (!container) return

      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved')
          },
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name')
      shakeForm()
      return
    }

    const fullPhone = `${countryCode}${phone}`.replace(/\s/g, '')
    const phoneRegex = /^\+\d{10,15}$/
    if (!phoneRegex.test(fullPhone)) {
      setError('Enter a valid phone number with country code')
      shakeForm()
      return
    }

    try {
      setLoading(true)
      const auth = getAuth(app)

      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier)
      window.confirmationResult = confirmationResult
      sessionStorage.setItem('verificationId', confirmationResult.verificationId)
      sessionStorage.setItem('signupMeta', JSON.stringify({ firstName, lastName, phone: fullPhone }))

      router.push(`/verify-otp?phone=${encodeURIComponent(fullPhone)}`)
    } catch (err: any) {
      console.error('OTP sending failed:', err)
      if (err.code === 'auth/billing-not-enabled') {
        setError('Phone sign-in requires Firebase billing to be enabled.')
      } else {
        setError('Failed to send OTP. Please try again.')
      }
      shakeForm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background text-text-primary">
      {/* ✅ Early mount for reCAPTCHA */}
      <div id="recaptcha-container" style={{ position: 'absolute', zIndex: -1 }} />

      <div className="absolute inset-0 z-0 animate-gradient" />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.form
          onSubmit={handleSignup}
          className={`w-full max-w-sm bg-surface border border-border rounded-xl shadow-xl p-8 ${shake ? 'animate-shake' : ''}`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-6">
            <Image src="/logo/Capten_logo_full.svg" alt="Capten Logo" width={120} height={40} />
          </div>

          <h2 className="text-2xl font-bold text-center mb-1">Create your account</h2>
          <p className="text-sm text-text-secondary text-center mb-5">Sign up using your phone number</p>

          {error && <div className="text-error text-sm mb-4 text-center">{error}</div>}

          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="enterprise-input w-full mb-4"
          />

          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="enterprise-input w-full mb-4"
          />

          <div className="flex mb-4 gap-2">
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

          <button type="submit" className="enterprise-button w-full" disabled={loading}>
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>

          <p className="text-xs text-center text-text-secondary mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-xs text-text-primary hover:text-accent-primary underline-offset-2 hover:underline transition">
              Log in
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
              { id: 'azure-ad', label: 'Microsoft', icon: 'microsoft.svg' },
              { id: 'github', label: 'GitHub', icon: 'github.svg' },
              { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin.svg' },
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => signIn(id, { callbackUrl: '/' })}
                type="button"
                className="flex items-center gap-3 w-full text-sm font-medium text-white py-2.5 px-4 rounded-md border border-border bg-input hover:bg-surface-hover hover:scale-[1.01] hover:shadow-lg transition-all duration-150"
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