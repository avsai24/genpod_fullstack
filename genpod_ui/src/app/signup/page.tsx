'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import Cookies from 'js-cookie'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [error, setError]   = useState('')
  const [shake, setShake]   = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const err = searchParams.get('error')
    if (err === 'not_found') {
      setError('No account found. Please sign up first.')
    } else if (err === 'already_exists') {
      setError('Account already exists. Redirecting to login…')
      setTimeout(() => router.push('/login'), 2500)
    } else if (err === 'registration_failed') {
      setError('User registration failed. Please try again.')
    }

    if (err) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }, [searchParams, router])

  const handleSocialSignup = async (provider: string) => {
    Cookies.set('genpod-auth-intent', 'signup', { path: '/' })
    await signIn(provider, { callbackUrl: '/post-social-redirect' })
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background text-text-primary">
      <div className="absolute inset-0 z-0 animate-gradient" />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.div
          className={`w-full max-w-sm bg-surface border border-border rounded-xl shadow-xl p-8 ${shake ? 'animate-shake' : ''}`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo & copy */}
          <div className="flex justify-center mb-6">
            <Image src="/logo/Capten_logo_full.svg" alt="Capten Logo" width={120} height={40} />
          </div>
          <h2 className="text-2xl font-bold text-center mb-1">Create your account</h2>
          <p className="text-sm text-text-secondary text-center mb-5">Sign up using a social provider</p>

          {/* ERROR BOX */}
          {error && (
            <div className="text-error text-sm mb-4 text-center bg-error/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* SOCIAL BUTTONS */}
          <div className="space-y-2">
            {[
              { id: 'google',    label: 'Google',            icon: 'google.svg'    },
              { id: 'azure-ad',  label: 'Microsoft Account', icon: 'microsoft.svg' },
              { id: 'github',    label: 'GitHub',            icon: 'github.svg'    },
              { id: 'gitlab',    label: 'GitLab',            icon: 'gitlab.svg'    },
              { id: 'linkedin',  label: 'LinkedIn',          icon: 'linkedin.svg'  },
              { id: 'atlassian', label: 'Atlassian',         icon: 'atlassian.svg' },
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

          <p className="text-xs text-center text-text-secondary mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-xs text-text-primary hover:underline">
              Log in
            </Link>
          </p>
        </motion.div>
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