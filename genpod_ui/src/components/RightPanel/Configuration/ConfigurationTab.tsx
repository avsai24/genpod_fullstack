'use client'

import { useEffect, useState } from 'react'
import PromptEditor from './PromptEditor'

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
    <div className="space-y-4 text-sm text-textPrimary">
      <h2 className="text-lg font-semibold">⚙️ Agent Settings</h2>
      {isConnected ? (
        config ? (
          <ul className="space-y-2 text-textSecondary">
            <li><strong>Max Users:</strong> {config.max_users}</li>
            <li><strong>Region:</strong> {config.region}</li>
            <li><strong>Logging Enabled:</strong> {config.logging_enabled ? 'Yes' : 'No'}</li>
          </ul>
        ) : (
          <p className="text-textSecondary">Waiting for configuration data...</p>
        )
      ) : (
        <p className="text-textSecondary">Connecting to configuration server...</p>
      )}
    </div>
  )

  return (
    <div className="w-full">
      {selectedTab === 'Prompt' ? <PromptEditor /> : renderSettingsTab()}
    </div>
  )
}