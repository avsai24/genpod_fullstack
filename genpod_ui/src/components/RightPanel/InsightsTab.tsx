'use client'

import { useEffect, useState } from 'react'

type Insights = {
  top_queries: string[]
  error_rate: string
  active_users: number
}

export default function InsightsTab() {
  const [insights, setInsights] = useState<Insights | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const eventSource = new EventSource('/api/insights')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setInsights(data.insights)
        setIsConnected(true)
      } catch (err) {
        console.error('❌ Failed to parse insights data:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('🔌 SSE error:', err)
      eventSource.close()
      setIsConnected(false)
    }

    return () => eventSource.close()
  }, [])

  return (
    <div className="p-6 space-y-4 text-sm text-gray-900">
      <h2 className="text-lg font-semibold">📈 Insights</h2>
      {isConnected ? (
        insights ? (
          <div className="space-y-2">
            <div>
              <strong>Top Queries:</strong>
              <ul className="list-disc ml-5 text-gray-700">
                {insights.top_queries.map((query, idx) => (
                  <li key={idx}>{query}</li>
                ))}
              </ul>
            </div>
            <p><strong>Error Rate:</strong> {insights.error_rate}</p>
            <p><strong>Active Users:</strong> {insights.active_users}</p>
          </div>
        ) : (
          <p>Waiting for insights...</p>
        )
      ) : (
        <p className="text-gray-500">Connecting to server...</p>
      )}
    </div>
  )
}