'use client'

import React, { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Loader2 } from 'lucide-react'
import { useAgentStreamStore } from '@/state/agentStreamStore'

export default function CodeViewTab() {
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] } | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const prompt = useAgentStreamStore((s) => s.prompt)
  const workflowComplete = useAgentStreamStore((s) => s.workflow?.completed)

  useEffect(() => {
    if (!prompt) {
      setIsConnected(false)
      return
    }

    const eventSource = new EventSource('/api/codeview')
    setIsConnected(true)

    eventSource.addEventListener('codeview', (event) => {
      try {
        const parsed = JSON.parse((event as MessageEvent).data)

        const nodes = parsed.nodes.map((node: any) => ({
          ...node,
          name: node.label || node.id
        }))

        const links = parsed.links.map((link: any) => ({
          ...link,
          label: link.type || ''
        }))

        setGraphData({ nodes, links })
      } catch (err) {
        console.error('Invalid graph JSON:', err)
      }
    })

    eventSource.onerror = () => {
      console.warn('📡 CodeView SSE error, closing...')
      eventSource.close()
      setIsConnected(false)
    }

    const interval = setInterval(() => {
      if (workflowComplete) {
        console.log('✅ Workflow complete — closing CodeView SSE.')
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

  const getOptions = () => ({
    backgroundColor: '#000000',
    tooltip: {},
    legend: [
      {
        data: ['function', 'variable'],
        textStyle: {
          color: '#ffffff'
        }
      }
    ],
    series: [
      {
        type: 'graph',
        layout: 'force',
        symbolSize: 70,
        roam: true,
        draggable: true,
        focusNodeAdjacency: true,
        label: {
          show: true,
          fontSize: 16,
          color: '#ffffff'
        },
        edgeLabel: {
          show: true,
          formatter: (params: any) => params.data.label || '',
          fontSize: 14,
          color: '#ffffff'
        },
        lineStyle: {
          color: '#888888'
        },
        categories: [
          { name: 'function' },
          { name: 'variable' }
        ],
        data: graphData?.nodes || [],
        links: graphData?.links || [],
        force: {
          repulsion: 400,
          edgeLength: [80, 120]
        }
      }
    ]
  })

  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-black text-white">
      {!prompt ? (
        <div className="text-center opacity-60 text-lg">
          No CodeView yet.
          <br />
          Start with a prompt.
        </div>
      ) : !isConnected && !graphData ? (
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin h-6 w-6" />
          <span className="text-sm text-gray-400">Connecting to CodeView agent...</span>
        </div>
      ) : graphData ? (
        <ReactECharts
          option={getOptions()}
          style={{ width: '100%', height: '100%' }}
        />
      ) : null}
    </div>
  )
}