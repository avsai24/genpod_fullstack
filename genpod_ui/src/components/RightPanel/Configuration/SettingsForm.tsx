'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Eye, EyeOff } from 'lucide-react'

export default function SettingsForm() {
  const { data: session, status } = useSession()
  const [platformName, setPlatformName] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [maskedToken, setMaskedToken] = useState(false)
  const [showToken, setShowToken] = useState(false)

  const [originalSettings, setOriginalSettings] = useState({
    platformName: '',
    accessToken: '',
  })

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return

    const fetchSettings = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/settings?user_id=${session.user?.email}`
        )
        const data = await res.json()

        if (data.settings) {
          setPlatformName(data.settings.platform_name)
          setAccessToken(data.settings.access_token)
          setOriginalSettings({
            platformName: data.settings.platform_name,
            accessToken: data.settings.access_token,
          })
          setMaskedToken(true)
        }
      } catch {
        setMessage(' Failed to fetch settings.')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [status, session])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session?.user?.email) {
      setMessage('You are not logged in.')
      return
    }

    // Don't submit if nothing changed
    if (
      platformName === originalSettings.platformName &&
      accessToken === originalSettings.accessToken
    ) {
      setMessage(' No changes to save.')
      return
    }

    try {
      const res = await fetch('http://localhost:8000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.email,
          platform_name: platformName,
          access_token: accessToken,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('Settings saved successfully!')
        setOriginalSettings({ platformName, accessToken })
        setMaskedToken(true)
        setShowToken(false)
      } else {
        setMessage(`${data.detail || 'Failed to save settings.'}`)
      }
    } catch {
      setMessage(' Server error while saving.')
    }
  }

  const isChanged =
    platformName !== originalSettings.platformName ||
    accessToken !== originalSettings.accessToken

  const displayToken = showToken
    ? accessToken
    : maskedToken
    ? '•'.repeat(32)
    : accessToken

  return (
    <div className="p-6 space-y-4 text-sm text-gray-900">
      <h2 className="text-lg font-semibold">Git Integration Settings</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Git Platform Name</label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => {
                setPlatformName(e.target.value)
                setMessage(null)
              }}
              className="w-full px-3 py-2 border rounded border-gray-300"
              placeholder="e.g. GitHub"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Personal Access Token</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={displayToken}
                onChange={(e) => {
                  setAccessToken(e.target.value)
                  setMaskedToken(false)
                  setMessage(null)
                }}
                className="w-full px-3 py-2 border rounded border-gray-300 pr-10"
                placeholder="••••••••••••••••••••••••••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {message && <p className="text-sm text-blue-600">{message}</p>}

          <button
            type="submit"
            className={`px-4 py-2 rounded text-white ${
              isChanged
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={!isChanged}
          >
            Save
          </button>
        </form>
      )}
    </div>
  )
}