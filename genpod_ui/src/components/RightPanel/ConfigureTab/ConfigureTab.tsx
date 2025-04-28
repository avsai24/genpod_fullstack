'use client'

import { useEffect, useState } from 'react'
import ConfigurationTab from './ConfigurationTab'
import SettingsForm from './SettingsForm'

type ConfigData = {
  max_users: string
  region: string
  logging_enabled: boolean
}

type SubTab = 'Prompt' | 'Settings'

export default function ConfigureTab() {
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [selectedTab, setSelectedTab] = useState<SubTab>('Prompt')

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
    <div className="w-full h-full px-6 py-8 bg-background text-textPrimary overflow-auto">
      <div className="max-w-4xl mx-auto bg-surface rounded-xl shadow-soft border border-border">
        {/* Sub-tab switcher */}
        <div className="flex gap-4 border-b border-border px-6 pt-4">
          {(['Prompt', 'Settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`py-2 px-4 text-sm font-medium rounded-t-md border-b-2 transition-all
                ${
                  selectedTab === tab
                    ? 'text-white border-white'
                    : 'text-textSecondary border-transparent hover:text-white hover:bg-input'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content area */}
        <div className="px-6 py-6">
          {selectedTab === 'Prompt' ? (
            <ConfigurationTab
              selectedTab={selectedTab}
              config={config}
              isConnected={isConnected}
            />
          ) : (
            <SettingsForm />
          )}
        </div>
      </div>
    </div>
  )
}