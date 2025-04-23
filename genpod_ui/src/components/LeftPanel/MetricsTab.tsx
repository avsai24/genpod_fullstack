'use client'

import { useEffect, useState } from 'react'
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { ChevronDown, ChevronUp } from 'lucide-react'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale)

type Metric = { name: string; value: string }
type TokenModel = {
  model: string
  calls: number
  input_tokens: string
  output_tokens: string
  total_cost: string
}
type MetricsData = {
  project_overview: Metric[]
  planned_tasks: Metric[]
  issues: Metric[]
  agent_state: Metric[]
  token_summary: Metric[]
  token_by_model: TokenModel[]
}

export default function MetricsTab() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [history, setHistory] = useState<number[]>([])
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const eventSource = new EventSource('/api/metrics')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.metrics) {
          setMetrics(data.metrics)
          setIsConnected(true)

          const completion = data.metrics.project_overview.find((m: Metric) => m.name === 'Completion (%)')
          if (completion) {
            const value = parseFloat(completion.value.replace('%', ''))
            setHistory(prev => [...prev.slice(-9), value])
          }
        }
      } catch (err) {
        console.error('Failed to parse metrics:', err)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      setIsConnected(false)
    }

    return () => eventSource.close()
  }, [])

  const toggle = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="p-6 space-y-8 text-sm text-gray-100 bg-[#0a0a0a] min-h-screen">
      <h2 className="text-2xl font-bold text-white">Real-Time Metrics</h2>

      {!isConnected ? (
        <p className="text-gray-400 animate-pulse">Connecting to metrics agent...</p>
      ) : metrics ? (
        <div className="space-y-6">
          <CollapsibleSection title="Project Overview" rows={metrics.project_overview} history={history} open={openSections["overview"]} toggle={() => toggle("overview")} />
          <CollapsibleSection title="Planned Tasks" rows={metrics.planned_tasks} open={openSections["planned"]} toggle={() => toggle("planned")} />
          <CollapsibleSection title="Issues" rows={metrics.issues} open={openSections["issues"]} toggle={() => toggle("issues")} />
          <CollapsibleSection title="Agent State" rows={metrics.agent_state} open={openSections["agent"]} toggle={() => toggle("agent")} />
          <CollapsibleSection title="Token Summary" rows={metrics.token_summary} open={openSections["summary"]} toggle={() => toggle("summary")} />
          <ModelTable rows={metrics.token_by_model} />
        </div>
      ) : null}
    </div>
  )
}

function CollapsibleSection({
  title,
  rows,
  history,
  open,
  toggle
}: {
  title: string
  rows: Metric[]
  history?: number[]
  open?: boolean
  toggle: () => void
}) {
  return (
    <div className="border border-[#2a2a2a] rounded-md overflow-hidden">
      <button onClick={toggle} className="flex justify-between items-center w-full px-4 py-3 text-white bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors">
        <span className="font-medium">{title}</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open && (
        <div className="p-4 grid grid-cols-2 gap-4">
          {rows.map((row, i) =>
            row.name.includes("Completion") ? (
              <ProgressBar key={i} label={row.name} value={parseFloat(row.value)} />
            ) : row.name.includes("Error Rate") || row.name === "Current Status" ? (
              <Badge key={i} label={row.name} value={row.value} />
            ) : (
              <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-4 py-3 shadow-sm">
                <p className="text-gray-400">{row.name}</p>
                <p className="text-teal-400 font-semibold text-lg">{row.value}</p>
              </div>
            )
          )}
        </div>
      )}

      {history && open && title.includes("Overview") && (
        <div className="px-4 pt-2 pb-4">
          <Line
            data={{
              labels: history.map((_, i) => `T-${history.length - i}`),
              datasets: [{
                label: 'Completion (%)',
                data: history,
                borderColor: '#14b8a6',
                backgroundColor: '#14b8a666',
                fill: true,
                tension: 0.4
              }]
            }}
            options={{
              scales: {
                y: { beginAtZero: true, max: 100, ticks: { color: '#ccc' }, grid: { color: '#333' } },
                x: { ticks: { color: '#ccc' }, grid: { color: '#333' } }
              },
              plugins: {
                legend: {
                  labels: { color: '#eee' }
                }
              }
            }}
            height={160}
          />
        </div>
      )}
    </div>
  )
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-400' : 'bg-red-500'
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded-md">
      <p className="text-gray-400 mb-2">{label}</p>
      <div className="w-full bg-gray-800 h-3 rounded">
        <div className={`h-3 rounded ${color}`} style={{ width: `${value}%` }} />
      </div>
      <p className="text-sm text-right text-white mt-1">{value.toFixed(1)}%</p>
    </div>
  )
}

function Badge({ label, value }: { label: string; value: string }) {
  const parsed = parseFloat(value.replace('%', ''))
  const badgeColor = isNaN(parsed) ? 'bg-blue-600' : parsed < 1 ? 'bg-green-600' : 'bg-red-600'
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded-md flex flex-col gap-1">
      <p className="text-gray-400">{label}</p>
      <span className={`px-2 py-1 rounded text-sm font-semibold text-white w-fit ${badgeColor}`}>
        {value}
      </span>
    </div>
  )
}

function ModelTable({ rows }: { rows: TokenModel[] }) {
  return (
    <div className="mt-4">
      <h3 className="font-semibold text-base text-white mb-2">Token Metrics by Model</h3>
      <div className="overflow-x-auto border border-[#2a2a2a] rounded-lg">
        <table className="min-w-full text-sm text-left bg-[#1a1a1a]">
          <thead className="bg-[#1a1a1a] text-gray-300 border-b border-[#2a2a2a]">
            <tr>
              <th className="px-4 py-2">Model</th>
              <th className="px-4 py-2">Calls</th>
              <th className="px-4 py-2">Input Tokens</th>
              <th className="px-4 py-2">Output Tokens</th>
              <th className="px-4 py-2">Total Cost</th>
            </tr>
          </thead>
          <tbody className="text-gray-200">
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-[#2a2a2a]">
                <td className="px-4 py-2">{row.model}</td>
                <td className="px-4 py-2">{row.calls}</td>
                <td className="px-4 py-2">{row.input_tokens}</td>
                <td className="px-4 py-2">{row.output_tokens}</td>
                <td className="px-4 py-2 text-green-400 font-semibold">{row.total_cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}