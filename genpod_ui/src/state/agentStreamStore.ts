// src/state/agentStreamStore.ts
'use client'

import { create } from 'zustand'

type WorkflowEvent = {
  agent_name: string
  status: 'STARTED' | 'FINISHED'
}

type LogEntry = {
  agent_name: string
  message: string
  timestamp: string
}

type AgentStreamStore = {
  prompt: string
  logs: LogEntry[]
  events: WorkflowEvent[]
  answer: string | null
  isStreaming: boolean
  startAgentStream: (prompt: string, user_id?: string) => void
  reset: () => void
}

export const useAgentStreamStore = create<AgentStreamStore>((set, get) => ({
  prompt: '',
  logs: [],
  events: [],
  answer: null,
  isStreaming: false,

  startAgentStream: (prompt: string, user_id = 'guest') => {
    if (get().isStreaming) {
        console.log('[💡 Zustand] Stream already running — skipping new connection')
        return
      }
    
      console.log('[✅ Zustand] Starting new SSE stream for prompt:', prompt)
    
    set({ prompt, logs: [], events: [], answer: null, isStreaming: true })

    const eventSource = new EventSource(`/api/agentStream?prompt=${encodeURIComponent(prompt)}&user_id=${user_id}`)

    eventSource.addEventListener('log', (e) => {
      const log = JSON.parse(e.data)
      const entry: LogEntry = {
        agent_name: log.agent_name,
        message: log.message,
        timestamp: log.timestamp,
      }
      set((s) => ({ logs: [...s.logs, entry].slice(-30) }))
    })

    eventSource.addEventListener('event', (e) => {
      const ev = JSON.parse(e.data) as WorkflowEvent
      set((s) => ({ events: [...s.events, ev] }))
    })

    eventSource.addEventListener('answer', (e) => {
      const data = JSON.parse(e.data)
      set({ answer: data.content, isStreaming: false })
      eventSource.close()
    })

    eventSource.onerror = () => {
      console.error('[AgentStream] SSE error')
      eventSource.close()
      set({ isStreaming: false })
    }
  },

  reset: () => {
    set({
      prompt: '',
      logs: [],
      events: [],
      answer: null,
      isStreaming: false,
    })
  },
}))