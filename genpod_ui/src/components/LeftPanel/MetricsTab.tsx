'use client'

import { useEffect, useState } from 'react'

type Metric = {
  name: string
  value: string
}

export default function MetricsTab() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const eventSource = new EventSource('/api/metrics')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.metrics) {
          setMetrics(data.metrics)
          setIsConnected(true)
        }
      } catch (err) {
        console.error('❌ Failed to parse metrics data:', err)
      }
    }

    eventSource.onerror = () => {
      console.error('🔌 SSE error: {}')
      eventSource.close()
      setIsConnected(false)
    }

    return () => eventSource.close()
  }, [])

  return (
    <div className="p-6 space-y-4 text-sm text-gray-900">
      <h2 className="text-lg font-semibold">📊 Real-Time Metrics</h2>

      {!isConnected ? (
        <p className="text-gray-500 animate-pulse">Connecting to metrics agent...</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4">
          {metrics.map((metric, idx) => (
            <li key={idx} className="border p-4 rounded-lg bg-gray-50">
              <p className="font-medium text-gray-700">{metric.name}</p>
              <p className="text-blue-600 font-semibold text-lg">{metric.value}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}