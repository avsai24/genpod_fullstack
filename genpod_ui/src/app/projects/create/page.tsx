'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function CreateProjectPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setError('')
    if (!userId) {
      setError('User session not found.')
      return
    }

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Project name cannot be empty.')
      return
    }

    if (trimmed.length > 20) {
      setError('Project name must be 20 characters or fewer.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, project_name: trimmed }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push(`/projects/${encodeURIComponent(trimmed)}`)
      } else {
        setError(data.message || 'Failed to create project.')
      }
    } catch (err) {
      console.error('❌ Project creation error:', err)
      setError('Unexpected error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-surface border border-border rounded-xl p-8 w-full max-w-md shadow-md">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Create New Project</h2>

        <input
          type="text"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter project name"
          className="w-full border border-border rounded px-4 py-2 mb-4 text-sm text-text-primary bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
        />

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-accent text-white py-2 rounded hover:bg-accent-hover transition disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </div>
  )
}