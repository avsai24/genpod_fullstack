'use client'

import { useState } from 'react'
import ChatTab from './LeftPanel/ChatTab'
import MetricsTab from './LeftPanel/MetricsTab'
import LogsTab from './LeftPanel/LogsTab'
import { MessageSquare, BarChart2, FileText } from 'lucide-react'

const TABS = ['Chat', 'Metrics', 'Logs'] as const
type Tab = (typeof TABS)[number]

export default function LeftPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('Chat')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Chat':
        return <ChatTab />
      case 'Metrics':
        return <MetricsTab />
      case 'Logs':
        return <LogsTab />
    }
  }

  const getIcon = (tab: Tab) => {
    switch (tab) {
      case 'Chat':
        return <MessageSquare size={16} />
      case 'Metrics':
        return <BarChart2 size={16} />
      case 'Logs':
        return <FileText size={16} />
    }
  }

  return (
    <div className="h-full flex flex-col bg-white text-gray-900">
      {/* Tab Buttons */}
      <div className="flex border-b bg-gray-100 text-sm px-2">
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
            {getIcon(tab)}
            <span>{tab}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">{renderTabContent()}</div>
    </div>
  )
}