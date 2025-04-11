'use client'

import { useEffect, useState } from 'react'
import { BarChart, Clock3, Sparkles, CheckCircle } from 'lucide-react'

type InsightsData = {
  summary: string
  healthScore: number
  timeSaved: string
  frameworksDetected: string[]
}

export default function InsightsTab() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch('/api/insights')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Failed to load insights', err)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [])

  if (loading) return <div className="p-4 text-sm text-gray-500">Loading insights...</div>
  if (!data) return <div className="p-4 text-sm text-red-500">Failed to load insights</div>

  return (
    <div className="p-4 space-y-4 text-sm text-gray-800">
      {/* Summary */}
      <div className="bg-white border rounded-xl p-4 shadow-sm flex gap-3">
        <Sparkles className="text-purple-500 mt-1" size={20} />
        <div>{data.summary}</div>
      </div>

      {/* Health Score */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm mb-2 text-gray-600">
          <BarChart size={16} /> Project Health Score
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-700 ease-out"
            style={{ width: `${data.healthScore}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">{data.healthScore}% healthy</div>
      </div>

      {/* Time Saved */}
      <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-3">
        <Clock3 className="text-blue-500" size={20} />
        <div>
          <strong>Time Saved:</strong> {data.timeSaved}
        </div>
      </div>

      {/* Frameworks Detected */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
          <CheckCircle size={16} className="text-green-600" />
          Frameworks Detected
        </div>
        <ul className="list-disc ml-6 text-sm text-gray-700">
          {data.frameworksDetected.map((fw) => (
            <li key={fw}>{fw}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}