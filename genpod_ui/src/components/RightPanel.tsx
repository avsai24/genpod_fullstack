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
    <div className="h-full flex flex-col bg-white text-gray-900">
      {/* Tab Buttons + UserMenu */}
      <div className="flex justify-between items-center border-b bg-gray-100 text-sm px-2">
        {/* Tabs */}
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1 px-4 py-2 font-medium border-b-2 transition-all
                ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 bg-white rounded-t-md shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-blue-500 hover:bg-gray-50'
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