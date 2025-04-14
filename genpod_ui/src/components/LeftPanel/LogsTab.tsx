'use client'

import { useEffect, useState } from 'react'

type LogEntry = {
  timestamp: string
  level: string
  message: string
}

export default function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const eventSource = new EventSource('/api/logs')

    eventSource.onmessage = (event) => {
      const { logs: newLogs } = JSON.parse(event.data)
      setLogs((prev) => [...prev, ...newLogs].slice(-50)) // keep last 50 logs
    }

    eventSource.onerror = () => {
      console.error('🔌 SSE logs error')
      eventSource.close()
      setConnected(false)
    }

    eventSource.onopen = () => {
      setConnected(true)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  return (
    <div className="p-4 space-y-2 text-sm text-gray-800">
      <h2 className="text-lg font-semibold mb-2">📜 Live Logs</h2>

      {connected ? (
        <ul className="space-y-1 max-h-[500px] overflow-y-auto">
          {logs.map((log, idx) => (
            <li
              key={idx}
              className={`border rounded p-2 bg-white shadow-sm ${
                log.level === 'ERROR'
                  ? 'border-red-500 text-red-600'
                  : log.level === 'WARN'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-gray-300'
              }`}
            >
              <span className="font-mono text-xs text-gray-500">{log.timestamp}</span>{' '}
              <span className="uppercase font-semibold">{log.level}</span>: {log.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 italic">Disconnected. Trying to reconnect...</p>
      )}
    </div>
  )
}