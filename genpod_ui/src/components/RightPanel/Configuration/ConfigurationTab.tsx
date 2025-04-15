'use client'

import { useEffect, useState } from 'react'
import PromptEditor from './PromptEditor' // 👈 Import the separated YAML prompt editor

interface ConfigurationTabProps {
  selectedTab: 'Prompt' | 'Settings'
  config: {
    max_users: string
    region: string
    logging_enabled: boolean
  } | null
  isConnected: boolean
}

export default function ConfigurationTab({
  selectedTab,
  config,
  isConnected,
}: ConfigurationTabProps) {
  const renderSettingsTab = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">⚙️ Agent Settings</h2>
      {isConnected ? (
        config ? (
          <ul className="space-y-2 text-sm text-gray-700">
            <li><strong>Max Users:</strong> {config.max_users}</li>
            <li><strong>Region:</strong> {config.region}</li>
            <li><strong>Logging Enabled:</strong> {config.logging_enabled ? 'Yes' : 'No'}</li>
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Waiting for configuration data...</p>
        )
      ) : (
        <p className="text-sm text-gray-400">Connecting to configuration server...</p>
      )}
    </div>
  )

  return (
    <div className="w-full">
      {selectedTab === 'Prompt' ? <PromptEditor /> : renderSettingsTab()}
    </div>
  )
}