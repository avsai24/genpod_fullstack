'use client'

import React, { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Loader2 } from 'lucide-react'
import { useAgentStreamStore } from '@/state/agentStreamStore'

export default function CodeViewTab() {
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] } | null>(null)
  const [categories, setCategories] = useState<{ name: string }[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [queryPrompt, setQueryPrompt] = useState('')
  const [loadingQuery, setLoadingQuery] = useState(false)
  const [filtering, setFiltering] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const prompt = useAgentStreamStore((s) => s.prompt)
  const workflowComplete = useAgentStreamStore((s) => s.workflow?.completed)

  // 🔁 Full Graph via SSE
  useEffect(() => {
    if (!prompt || filtering) {
      setIsConnected(false)
      return
    }

    const eventSource = new EventSource('/api/codeview')
    setIsConnected(true)

    eventSource.addEventListener('codeview', (event) => {
      try {
        const parsed = JSON.parse((event as MessageEvent).data)
        if (!parsed.nodes || !parsed.links) return

        const categorySet = new Set<string>()
        const nodes = parsed.nodes.map((node: any) => {
          const category = (node.label || node.type || 'unknown').toLowerCase()
          categorySet.add(category)
          return {
            ...node,
            name: node.name || node.title || node.id,
            category
          }
        })

        const links = parsed.links.map((link: any) => ({
          ...link,
          label: link.type || '',
          type: link.type || ''
        }))

        setGraphData({ nodes, links })
        setCategories(Array.from(categorySet).map((c) => ({ name: c })))
        console.log('🌐 Full Graph Loaded:', { nodes, links })
      } catch (err) {
        console.error('❌ Invalid graph JSON:', err)
      }
    })

    eventSource.onerror = () => {
      console.warn('📡 CodeView SSE error, closing...')
      eventSource.close()
      setIsConnected(false)
    }

    const interval = setInterval(() => {
      if (workflowComplete) {
        eventSource.close()
        setIsConnected(false)
        clearInterval(interval)
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      eventSource.close()
    }
  }, [prompt, workflowComplete, filtering])

  // 🔍 Filtered Query
  const handleQuery = async () => {
    if (!queryPrompt.trim()) {
      setFiltering(false)
      setErrorMessage('')
      return
    }

    setLoadingQuery(true)
    setFiltering(true)

    try {
      const res = await fetch('/api/codeview/codeview-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: queryPrompt })
      })

      const data = await res.json()
      console.log('🔍 Filtered graph data from backend:', data)

      if (!data.nodes || !data.links || data.nodes.length === 0) {
        setErrorMessage('❌ No matching results. Try a different question.')
        setGraphData({ nodes: [], links: [] })
        return
      }

      const categorySet = new Set<string>()
      const nodes = data.nodes.map((node: any) => {
        const category = (node.label || node.type || 'unknown').toLowerCase()
        categorySet.add(category)
        return {
          ...node,
          name: node.name || node.title || node.id,
          category
        }
      })

      const links = data.links.map((link: any) => ({
        ...link,
        label: link.type || '',
        type: link.type || ''
      }))

      console.log('🧠 Parsed Nodes:', nodes)
      console.log('🔗 Parsed Links:', links)

      setGraphData({ nodes, links })
      setCategories(Array.from(categorySet).map((c) => ({ name: c })))
      setErrorMessage('')
    } catch (err) {
      console.error('Query error:', err)
      setErrorMessage('❌ Error connecting to backend.')
    }

    setLoadingQuery(false)
  }

  const getOptions = () => ({
    backgroundColor: '#000000',
    tooltip: {
      formatter: (params: any) => {
        const label = params.data?.label?.toLowerCase?.() || ''
        const name = params.data?.name || '[unnamed]'
        return `<b>${label}:</b> ${name}`
      }
    },
    legend: [
      {
        data: categories.map((c) => c.name),
        textStyle: { color: '#ffffff' }
      }
    ],
    series: [
      {
        type: 'graph',
        layout: 'force',
        symbolSize: 60,
        roam: true,
        draggable: true,
        focusNodeAdjacency: true,
        label: {
          show: true,
          fontSize: 14,
          color: '#ffffff',
          overflow: 'truncate',
          width: 100
        },
        edgeLabel: {
          show: true,
          formatter: (params: any) => params.data.type || '',
          fontSize: 10,
          color: '#ccc',
          rotate: true
        },
        lineStyle: {
          color: '#888',
          opacity: 0.7,
          width: 1
        },
        categories,
        data: graphData?.nodes || [],
        links: graphData?.links || [],
        force: {
          repulsion: 1000,
          edgeLength: [60, 120],
          gravity: 0.2
        },
        emphasis: { focus: 'adjacency' },
        animation: true,
        containLabel: true
      }
    ]
  })

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-black text-white">
      {/* 🔍 Input box */}
      <div className="p-2 border-b border-gray-800 bg-gray-900 flex items-center gap-2">
        <input
          className="flex-1 bg-gray-800 text-white border border-gray-600 rounded px-3 py-1 text-sm"
          placeholder="Ask a question (e.g. movies by Tom Hanks)"
          value={queryPrompt}
          onChange={(e) => setQueryPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
        />
        <button
          onClick={handleQuery}
          disabled={loadingQuery}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
        >
          {loadingQuery ? 'Searching...' : 'Search'}
        </button>
        {filtering && (
          <button
            onClick={() => {
              setQueryPrompt('')
              setFiltering(false)
              setErrorMessage('')
              setLoadingQuery(false)
            }}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {/* 🌐 Graph or Messages */}
      {!graphData && !filtering ? (
        <div className="text-center opacity-60 text-lg flex-1 flex items-center justify-center">
          No CodeView yet.
          <br />
          Start with a prompt.
        </div>
      ) : filtering && graphData?.nodes.length === 0 ? (
        <div className="text-center text-red-400 flex-1 flex items-center justify-center">
          {errorMessage || 'No matching results.'}
        </div>
      ) : !isConnected && !graphData ? (
        <div className="flex flex-col items-center justify-center gap-2 flex-1">
          <Loader2 className="animate-spin h-6 w-6" />
          <span className="text-sm text-gray-400">Connecting to CodeView agent...</span>
        </div>
      ) : graphData ? (
        <div className="relative flex-1 w-full h-full overflow-hidden">
          <div className="absolute inset-0">
            <ReactECharts
              option={getOptions()}
              style={{ width: '100%', height: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}