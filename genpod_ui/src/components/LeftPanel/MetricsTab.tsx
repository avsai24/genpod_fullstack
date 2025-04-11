'use client'

import { useEffect, useState } from 'react'
import { GaugeCircle, Timer, Hash } from 'lucide-react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

type MetricsData = {
  modelProgress: number
  tokensUsed: number
  estimatedTimeRemaining: string
}

export default function MetricsTab() {
  const [data, setData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/metrics')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Failed to load metrics', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (loading) return <div className="p-4 text-sm text-gray-500">Loading metrics...</div>
  if (!data) return <div className="p-4 text-sm text-red-500">Failed to load metrics</div>

  return (
    <div className="p-4 space-y-6">

      {/* Progress Card */}
      <div className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
          <GaugeCircle size={16} /> Model Progress
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-700 ease-out"
            style={{ width: `${data.modelProgress}%` }}
          />
        </div>
        <div className="text-xs text-gray-500">{data.modelProgress}% complete</div>
      </div>

      {/* Token Count */}
      <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-3">
        <Hash className="text-blue-500" size={20} />
        <div className="text-sm text-gray-700">
          <strong>Tokens Used:</strong> {data.tokensUsed.toLocaleString()}
        </div>
      </div>

      {/* ETA */}
      <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-3">
        <Timer className="text-blue-500" size={20} />
        <div className="text-sm text-gray-700">
          <strong>Estimated Time Remaining:</strong> {data.estimatedTimeRemaining}
        </div>
      </div>
    </div>
  )
}