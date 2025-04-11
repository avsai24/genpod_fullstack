'use client'

import { useEffect, useState } from 'react'
import { Terminal } from 'lucide-react'

export default function LogsTab() {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/logs')
        const data = await res.json()
        setLogs(data.logs || [])
      } catch (err) {
        console.error('Failed to load logs:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  if (loading) return <div className="p-4 text-sm text-gray-500">Loading logs...</div>
  if (error) return <div className="p-4 text-sm text-red-500">Failed to fetch logs.</div>

  return (
    <div className="p-4 space-y-2 font-mono text-sm text-gray-800 bg-white">
      {logs.map((log, i) => (
        <div key={i} className="bg-gray-100 p-2 rounded border border-gray-200 shadow-sm flex gap-2 items-start">
          <Terminal className="w-4 h-4 text-blue-500 mt-1" />
          <span>{log}</span>
        </div>
      ))}
    </div>
  )
}