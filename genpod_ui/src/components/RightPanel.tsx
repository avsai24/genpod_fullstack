'use client'

import { useState } from 'react'
import CodeView from './RightPanel/CodeView'
import PreviewView from './RightPanel/PreviewView'
import ConfigureTab from './RightPanel/ConfigureTab'
import InsightsTab from './RightPanel/InsightsTab'
import UserMenu from '@/components/auth/UserMenu'

const TABS = ['Code', 'Preview', 'Configure', 'Insights'] as const
type Tab = (typeof TABS)[number]

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('Code')
  const projectPath = '/Users/venkatasaiancha/Documents/captenai/genpod_UI/genpod_ui'

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Code':
        return <CodeView />
      case 'Preview':
        return <PreviewView projectPath={projectPath} />
      case 'Configure':
        return <ConfigureTab />
      case 'Insights':
        return <InsightsTab />
    }
  }

  return (
    <div className="h-full flex flex-col bg-surface text-text-primary">
      {/* Tab Buttons + UserMenu */}
      <div className="flex justify-between items-center border-b border-border bg-background text-sm px-2">
        {/* Tabs */}
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1 px-4 py-2 font-medium border-b-2 transition-all duration-200 ease-in-out
                ${
                  activeTab === tab
                    ? 'border-primary text-primary bg-surface rounded-t-md shadow-sm'
                    : 'border-transparent text-text-secondary hover:text-primary hover:bg-surface'
                }`}
            >
              <span>{tab}</span>
            </button>
          ))}
        </div>

        {/* User Info + Sign out */}
        <UserMenu />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">{renderTabContent()}</div>
    </div>
  )
}