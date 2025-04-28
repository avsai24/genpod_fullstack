'use client'

import { useAgentStreamStore } from '@/state/agentStreamStore'
import { CheckCircle2 } from 'lucide-react'

export default function InsightsTab() {
  const prompt = useAgentStreamStore((s) => s.prompt)

  return (
    <div className="h-full flex flex-col bg-background text-textPrimary p-6">
      {prompt ? (
        <>
          <h2 className="text-2xl font-semibold mb-6">Insights Overview</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Top Queries</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="text-success" size={16} />
                  <span>configure AI agents</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="text-success" size={16} />
                  <span>setup prompts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="text-success" size={16} />
                  <span>track agent memory</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface border border-border rounded-lg p-4">
                <div className="text-sm text-textSecondary">Error Rate</div>
                <div className="text-2xl font-semibold mt-1">1.7%</div>
              </div>
              <div className="bg-surface border border-border rounded-lg p-4">
                <div className="text-sm text-textSecondary">Active Users</div>
                <div className="text-2xl font-semibold mt-1">113</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-textSecondary">
          No workflow yet. Start with a prompt.
        </div>
      )}
    </div>
  )
}