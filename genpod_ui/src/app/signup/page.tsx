'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const shakeForm = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid Gmail address')
      shakeForm()
      return
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
    if (!passwordRegex.test(password)) {
      setError('Password must be 8+ chars with uppercase, number & symbol')
      shakeForm()
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      shakeForm()
      return
    }

    // Simulate API call success
    router.push('/login')
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background text-text-primary">
      <div className="absolute inset-0 z-0 animate-gradient" />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.form
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          onSubmit={handleSignup}
          className={`w-full max-w-sm bg-surface border border-border rounded-xl shadow-xl p-8 ${
            shake ? 'animate-shake' : ''
          }`}
        >
          <div className="flex justify-center mb-6">
            <Image src="/logo/logo.png" alt="Genpod Logo" width={120} height={40} />
          </div>

          <h2 className="text-2xl font-bold text-center mb-1">Create your account</h2>
          <p className="text-sm text-text-secondary text-center mb-5">Sign up with your team Gmail</p>

          {error && <div className="text-error text-sm mb-4 text-center">{error}</div>}

          <input
            type="email"
            placeholder="Gmail address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="enterprise-input w-full mb-4"
          />

          <div className="relative mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="enterprise-input w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative mb-6">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="enterprise-input w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" className="enterprise-button w-full">
            Sign Up
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

          {/* Social Signups */}
          <div className="space-y-2">
            {[
              { id: 'google', label: 'Google', icon: 'google.svg' },
              { id: 'azure-ad', label: 'Microsoft Account', icon: 'microsoft.svg' },
              { id: 'github', label: 'GitHub', icon: 'github.svg' },
              { id: 'gitlab', label: 'GitLab', icon: 'gitlab.svg' },
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