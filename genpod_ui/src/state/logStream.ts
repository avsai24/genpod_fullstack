// src/state/logStream.ts
'use client'

import { useLogStore } from './logStore'
import type { LogEntry } from '@/types/logs'

let eventSource: EventSource | null = null

export function startLogStream(prompt: string, user_id = 'guest') {
  if (eventSource) return // already started

  eventSource = new EventSource(`/api/agentStream?prompt=${encodeURIComponent(prompt)}&user_id=${user_id}`)

  eventSource.addEventListener('log', (e) => {
    try {
      const log = JSON.parse(e.data) as {
        
        agent_name: string
        message: string
        timestamp: string
      }
      console.log('[Logs] Received:', log)
      const formatted: LogEntry = {
        timestamp: log.timestamp,
        level: 'INFO', // or dynamic if you want later
        message: `[${log.agent_name}] ${log.message}`
      }

      useLogStore.getState().addLogs([formatted])
    } catch (err) {
      console.error('[Logs] Failed to parse log entry:', e)
    }
  })

  eventSource.onerror = (err) => {
    console.error('[Logs] SSE stream error:', err)
    eventSource?.close()
    eventSource = null
  }
}