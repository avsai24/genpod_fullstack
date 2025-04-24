'use client'

import { useState } from 'react'
import ChatTab from './LeftPanel/ChatTab'
import MetricsTab from './LeftPanel/MetricsTab'
import LogsTab from './LeftPanel/LogsTab'
import WorkflowTab from './LeftPanel/WorkflowTab'

import {
  MessageSquare,
  BarChart2,
  FileText,
  Share2,
} from 'lucide-react'

const TABS = ['Chat', 'Metrics', 'Logs', 'Workflow'] as const
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
      case 'Workflow':
        return <WorkflowTab />
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
      case 'Workflow':
        return <Share2 size={16} />
    }
  }

  return (
    <div className="h-full flex flex-col bg-surface text-text-primary">
      {/* Tab Buttons */}
      <div className="flex border-b border-border bg-background text-sm px-2">
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