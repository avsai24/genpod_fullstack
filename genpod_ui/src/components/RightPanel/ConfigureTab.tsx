'use client'

import { useEffect, useState } from 'react'

type ConfigData = {
  max_users: string
  region: string
  logging_enabled: boolean
}

export default function ConfigureTab() {
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const eventSource = new EventSource('/api/configure')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setConfig(data.configure)
        setIsConnected(true)
      } catch (err) {
        console.error('❌ Failed to parse configure data:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('🔌 SSE error:', err)
      eventSource.close()
      setIsConnected(false)
    }

    return () => eventSource.close()
  }, [])

  return (
    <div className="p-6 space-y-4 text-sm text-gray-900">
      <h2 className="text-lg font-semibold">🛠️ Configuration</h2>
      {isConnected ? (
        config ? (
          <ul className="space-y-2">
            <li><strong>Max Users:</strong> {config.max_users}</li>
            <li><strong>Region:</strong> {config.region}</li>
            <li><strong>Logging Enabled:</strong> {config.logging_enabled ? 'Yes' : 'No'}</li>
          </ul>
        ) : (
          <p>Waiting for configuration...</p>
        )
      ) : (
        <p className="text-gray-500">Connecting to server...</p>
      )}
    </div>
  )
}