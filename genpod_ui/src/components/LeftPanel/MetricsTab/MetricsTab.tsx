'use client'

import { useEffect, useState } from 'react'
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useAgentStreamStore } from '@/state/agentStreamStore'

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
  const metrics = useAgentStreamStore(s => s.metrics)
  const setMetrics = useAgentStreamStore(s => s.setMetrics)
  
  const [isConnected, setIsConnected] = useState(false)
  const [history, setHistory] = useState<number[]>([])
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const prompt = useAgentStreamStore((s) => s.prompt)
  const workflowComplete = useAgentStreamStore((s) => s.workflow?.completed)

  useEffect(() => {
    
    if (!prompt) {
      setIsConnected(false)
      return
    }
    const eventSource = new EventSource('/api/metrics')
    setIsConnected(true)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.metrics) {
          setMetrics(data.metrics)

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
      console.warn('📡 Metrics SSE error, closing...')
      eventSource.close()
      setIsConnected(false)
    }

    const interval = setInterval(() => {
      if (workflowComplete) {
        console.log('✅ Workflow complete — closing metrics SSE.')
        eventSource.close()
        setIsConnected(false)
        clearInterval(interval)
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      eventSource.close()
    }
  }, [prompt, workflowComplete])

  const toggle = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 space-y-8 text-sm text-textPrimary bg-background custom-scrollbar">
      {/* <h2 className="text-2xl font-bold text-textPrimary">Real-Time Metrics</h2> */}

      {!prompt ? (
        <div className="flex-1 flex items-center justify-center text-sm text-textSecondary">
          No workflow yet. Start with a prompt to see metrics.
        </div>
      ) : !isConnected && !metrics ? (
        <p className="text-textSecondary animate-pulse">Connecting to metrics agent...</p>
      ) : metrics ? (
        <div className="space-y-6">
          <CollapsibleSection title="Project Overview" rows={metrics.project_overview} history={history} open={openSections["overview"]} toggle={() => toggle("overview")} />
          <CollapsibleSection title="Planned Tasks" rows={metrics.planned_tasks} open={openSections["planned"]} toggle={() => toggle("planned")} />
          <CollapsibleSection title="Issues" rows={metrics.issues} open={openSections["issues"]} toggle={() => toggle("issues")} />
          <CollapsibleSection title="Agent State" rows={metrics.agent_state} open={openSections["agent"]} toggle={() => toggle("agent")} />
          <CollapsibleSection title="Token Summary" rows={metrics.token_summary} open={openSections["summary"]} toggle={() => toggle("summary")} />
          <ModelTable rows={metrics.token_by_model} />
          {!isConnected && (
            <p className="text-xs text-textSecondary mt-4">Workflow is complete. Showing last known metrics snapshot.</p>
          )}
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
    <div className="border border-border rounded-md overflow-hidden">
      <button onClick={toggle} className="flex justify-between items-center w-full px-4 py-3 text-textPrimary bg-surface hover:bg-input transition-colors">
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
              <div key={i} className="bg-surface border border-border rounded-md px-4 py-3 shadow-sm">
                <p className="text-textSecondary">{row.name}</p>
                <p className="text-accent font-semibold text-lg">{row.value}</p>
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
                borderColor: '#3B82F6',
                backgroundColor: '#3B82F666',
                fill: true,
                tension: 0.4
              }]
            }}
            options={{
              scales: {
                y: { beginAtZero: true, max: 100, ticks: { color: '#A1A1AA' }, grid: { color: '#2A2A2A' } },
                x: { ticks: { color: '#A1A1AA' }, grid: { color: '#2A2A2A' } }
              },
              plugins: {
                legend: {
                  labels: { color: '#E5E5E5' }
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
  const color = value >= 80 ? 'bg-success' : value >= 50 ? 'bg-warning' : 'bg-error'
  return (
    <div className="bg-surface border border-border p-4 rounded-md">
      <p className="text-textSecondary mb-2">{label}</p>
      <div className="w-full bg-input h-3 rounded">
        <div className={`h-3 rounded ${color}`} style={{ width: `${value}%` }} />
      </div>
      <p className="text-sm text-right text-textPrimary mt-1">{value.toFixed(1)}%</p>
    </div>
  )
}

function Badge({ label, value }: { label: string; value: string }) {
  const parsed = parseFloat(value.replace('%', ''))
  const badgeColor = isNaN(parsed) ? 'bg-accent' : parsed < 1 ? 'bg-success' : 'bg-error'
  return (
    <div className="bg-surface border border-border p-4 rounded-md flex flex-col gap-1">
      <p className="text-textSecondary">{label}</p>
      <span className={`px-2 py-1 rounded text-sm font-semibold text-white w-fit ${badgeColor}`}>
        {value}
      </span>
    </div>
  )
}

function ModelTable({ rows }: { rows: TokenModel[] }) {
  return (
    <div className="mt-4">
      <h3 className="font-semibold text-base text-textPrimary mb-2">Token Metrics by Model</h3>
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="min-w-full text-sm text-left bg-surface">
          <thead className="bg-surface text-textSecondary border-b border-border">
            <tr>
              <th className="px-4 py-2">Model</th>
              <th className="px-4 py-2">Calls</th>
              <th className="px-4 py-2">Input Tokens</th>
              <th className="px-4 py-2">Output Tokens</th>
              <th className="px-4 py-2">Total Cost</th>
            </tr>
          </thead>
          <tbody className="text-textPrimary">
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-2">{row.model}</td>
                <td className="px-4 py-2">{row.calls}</td>
                <td className="px-4 py-2">{row.input_tokens}</td>
                <td className="px-4 py-2">{row.output_tokens}</td>
                <td className="px-4 py-2">{row.total_cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}