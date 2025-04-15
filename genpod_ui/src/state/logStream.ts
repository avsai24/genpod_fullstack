// src/state/logStream.ts
'use client'

import { useLogStore } from './logStore'
import type { LogEntry } from '@/types/logs'

let isStarted = false

export function startLogStream() {
  if (isStarted) return
  isStarted = true

  const eventSource = new EventSource('/api/logs')

  eventSource.onmessage = (event) => {
    try {
      const { logs: newLogs } = JSON.parse(event.data)
      if (Array.isArray(newLogs)) {
        // ✅ Use zustand store update function
        useLogStore.getState().addLogs(newLogs as LogEntry[])
      } else {
        console.warn('Expected logs array, got:', newLogs)
      }
    } catch (err) {
      console.error('Error parsing logs SSE:', err)
    }
  }

  eventSource.onerror = () => {
    console.error('SSE connection error')
    eventSource.close()
    isStarted = false
  }
}