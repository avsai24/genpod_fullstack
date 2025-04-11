'use client'

import { useEffect, useState } from 'react'
import { Settings, Terminal, Server } from 'lucide-react'

type ConfigData = Record<string, string>

export default function ConfigureTab() {
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/configure')
        const json = await res.json()
        setConfig(json)
      } catch (err) {
        console.error('Failed to load config', err)
        setConfig(null)
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Loading configuration...</div>
  }

  if (!config) {
    return <div className="p-4 text-sm text-red-500">Failed to load configuration</div>
  }

  return (
    <div className="p-4 space-y-4">
      {Object.entries(config).map(([key, value]) => (
        <div
          key={key}
          className="rounded-xl border bg-white p-4 shadow-sm flex items-start gap-3"
        >
          <Settings className="text-blue-500" size={20} />
          <div className="text-sm text-gray-700">
            <strong className="capitalize">{key}:</strong>{' '}
            <span className="ml-1 text-gray-900">{value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}