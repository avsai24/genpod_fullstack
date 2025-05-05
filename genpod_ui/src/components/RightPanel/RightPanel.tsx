'use client'

import { useState } from 'react'
import CodeView from './CodeTab/CodeView'
import PreviewView from './PreviewTab/PreviewView'
import ConfigureTab from './ConfigureTab/ConfigureTab'
import InsightsTab from './InsightsTab/InsightsTab'
import {
  Code2,
  Eye,
  Settings,
  Lightbulb
} from 'lucide-react'

const TABS = ['Code', 'Preview', 'Configure', 'Insights'] as const
type Tab = (typeof TABS)[number]

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('Code')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Code':
        return <CodeView />
      case 'Preview':
        return <PreviewView />
      case 'Configure':
        return <ConfigureTab />
      case 'Insights':
        return <InsightsTab />
    }
  }

  const getIcon = (tab: Tab) => {
    switch (tab) {
      case 'Code':
        return <Code2 size={16} />
      case 'Preview':
        return <Eye size={16} />
      case 'Configure':
        return <Settings size={16} />
      case 'Insights':
        return <Lightbulb size={16} />
    }
  }

  return (
    <div className="h-full flex flex-col bg-surface text-text-primary">
      {/* Tab Buttons */}
      <div className="flex justify-start items-center border-b border-border bg-background text-sm px-2">
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