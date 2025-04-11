'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
    })

    if (res?.error) {
      setError('Invalid credentials')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden text-white">
      <div className="absolute inset-0 animate-gradient z-0" />

      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <motion.form
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          onSubmit={handleLogin}
          className="bg-[#1a1a1a] p-8 rounded-xl border border-[#2a2a2a] shadow-lg w-full max-w-sm"
        >
          <h2 className="text-2xl font-semibold mb-2 text-center">🔐 Genpod Login</h2>
          <p className="text-sm text-gray-400 mb-6 text-center">Secure access to your Genpod workspace</p>

          {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 rounded bg-black text-white border border-[#2a2a2a] mb-4 focus:outline-none focus:border-[#14b8a6]"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded bg-black text-white border border-[#2a2a2a] mb-4 focus:outline-none focus:border-[#14b8a6]"
          />

          <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
            <label className="flex items-center space-x-2">
              <input type="checkbox" />
              <span>Remember Me</span>
            </label>
            <a href="#" className="text-[#14b8a6] hover:underline">Forgot Password?</a>
          </div>

          <button
            type="submit"
            className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white py-2 rounded font-medium transition"
          >
            Sign In
          </button>
        </motion.form>
      </div>
    </div>
  )
}