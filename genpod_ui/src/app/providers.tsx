'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import Sidebar from '@/components/sidebar/Sidebar'
import SplitLayout from '@/components/layouts/SplitLayout'
import LeftPanel from '@/components/LeftPanel/LeftPanel'

import CodeView from '@/components/RightPanel/CodeTab/CodeTab'
import PreviewView from '@/components/RightPanel/PreviewTab/PreviewView'
import ConfigureTab from '@/components/RightPanel/ConfigureTab/ConfigureTab'
import InsightsTab from '@/components/RightPanel/InsightsTab/InsightsTab'
import CodeViewTab from '@/components/RightPanel/CodeViewTab/CodeViewTab'
import {
  Code2,
  Eye,
  Settings,
  Lightbulb,
  Waypoints
} from 'lucide-react'

import { useAgentStreamStore } from '@/state/agentStreamStore'

const TABS = ['Code', 'Preview', 'Configure', 'Insights', 'CodeView'] as const
type Tab = (typeof TABS)[number]

export default function Providers() {
  const searchParams = useSearchParams()
  const startAgentStream = useAgentStreamStore((state) => state.startAgentStream)

  const [activeTab, setActiveTab] = useState<Tab>('Code')

  useEffect(() => {
    const prompt = searchParams.get('prompt')
    if (prompt) {
      console.log('🚀 Starting agent stream with prompt from URL:', prompt)
      startAgentStream(prompt)
    }
  }, [searchParams, startAgentStream])

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
      case 'CodeView':
        return <CodeViewTab />
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
      case 'CodeView':
        return <Waypoints size={16} />
    }
  }

  const TabBar = (
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
  )

  return (
    <AuthGuard>
      <div className="flex h-screen w-full">
        <Sidebar />
        <div className="flex-1">
          <SplitLayout
            left={<LeftPanel />}
            right={
              <div className="h-full flex flex-col">
                {TabBar}
                <div className="flex-1 overflow-auto">{renderTabContent()}</div>
              </div>
            }
          />
        </div>
      </div>
    </AuthGuard>
  )
}