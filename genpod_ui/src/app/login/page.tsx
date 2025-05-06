'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { data: session } = useSession()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    console.log('🧠 Current session:', session)
  }, [session])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      setError('Please fill in all fields')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(username)) {
      setError('Please enter a valid email address')
      return
    }

    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
      callbackUrl: '/',
    })

    if (res?.ok) {
      window.location.href = res.url || '/'
    } else {
      setError(res?.error || 'Invalid credentials')
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
          <Image src="/logo/logo.png" alt="Genpod Logo" width={120} height={40} />
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">Welcome back</h2>
        <p className="text-sm text-text-secondary text-center mb-6">Login to your Genpod workspace</p>

        {error && <div className="text-error text-sm mb-4 text-center">{error}</div>}

        {/* Credentials Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Email address"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="enterprise-input w-full"
          />

          <div className="relative">
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

          <div className="flex justify-end mt-1 mb-2">
            <Link
              href="/forgot-password"
              className="text-xs text-text-primary hover:text-accent-primary underline-offset-2 hover:underline transition"
            >
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="enterprise-button w-full mt-1">
            Continue
          </button>
        </form>

        {/* Navigation link */}
        <p className="text-sm text-center text-text-secondary mt-5">
          Don’t have an account?{' '}
          <Link
            href="/signup"
            className="text-xs text-text-primary hover:text-accent-primary underline-offset-2 hover:underline transition"
          >
            Create one
          </Link>
        </p>

        {/* Divider */}
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

        {/* Footer */}
        <p className="text-center text-xs text-text-secondary mt-6">
          <Link href="#" className="hover:underline">
            Terms of Use
          </Link>{' '}
          |{' '}
          <Link href="#" className="hover:underline">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  )
}