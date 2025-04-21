'use client'

import React, { useEffect, useCallback, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  addEdge,
  Connection,
  Edge,
  Node,
  useEdgesState,
  useNodesState,
} from 'react-flow-renderer'
import { useAgentStreamStore } from '@/state/agentStreamStore'
import clsx from 'clsx'

const initialNodes: Node[] = [
  {
    id: 'prompt',
    data: { label: 'Prompt' },
    position: { x: 0, y: -100 },
    style: {
      padding: 10,
      background: '#fef9c3',
      border: '1px solid #facc15',
      borderRadius: 8,
    },
  },
  { id: 'supervisor', data: { label: 'Supervisor' }, position: { x: 0, y: 0 }, style: { padding: 10 } },
  { id: 'planner', data: { label: 'Planner' }, position: { x: 0, y: 100 }, style: { padding: 10 } },
  { id: 'architect', data: { label: 'Architect' }, position: { x: 0, y: 200 }, style: { padding: 10 } },
  { id: 'coder', data: { label: 'Coder' }, position: { x: 0, y: 300 }, style: { padding: 10 } },
  { id: 'tester', data: { label: 'Tester' }, position: { x: 0, y: 400 }, style: { padding: 10 } },
  { id: 'reviewer', data: { label: 'Reviewer' }, position: { x: 0, y: 500 }, style: { padding: 10 } },
  {
    id: 'complete',
    data: { label: 'Workflow complete' },
    position: { x: 0, y: 600 },
    style: {
      padding: 10,
      border: '1px solid #ccc',
      borderRadius: 8,
    },
  },
]

const initialEdges: Edge[] = [
  { id: 'e0', source: 'prompt', target: 'supervisor' },
  { id: 'e1', source: 'supervisor', target: 'planner' },
  { id: 'e2', source: 'planner', target: 'architect' },
  { id: 'e3', source: 'architect', target: 'coder' },
  { id: 'e4', source: 'coder', target: 'tester' },
  { id: 'e5', source: 'tester', target: 'reviewer' },
  { id: 'e6', source: 'reviewer', target: 'complete' },
]

function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const prompt = useAgentStreamStore((s) => s.prompt)
  const events = useAgentStreamStore((s) => s.events)
  const logs = useAgentStreamStore((s) => s.logs)

  const onConnect = useCallback((params: Edge | Connection) => {
    setEdges((eds) => addEdge(params, eds))
  }, [setEdges])

  const handleNodeClick = (nodeId: string) => setSelectedNodeId(nodeId)

  useEffect(() => {
    setNodes(initialNodes)
    setSelectedNodeId(null)
  }, [prompt])

  useEffect(() => {
    if (!events.length) return
    setNodes((prev) => {
      let updated = [...prev]
      events.forEach((event) => {
        const id = event.agent_name.toLowerCase()
        updated = updated.map((node) => {
          const isPrompt = node.id === 'prompt' && id === 'supervisor' && event.status === 'STARTED'
          const isComplete = node.id === 'complete' && id === 'reviewer' && event.status === 'FINISHED'
          const isAgent = node.id === id

          if (isPrompt) {
            return {
              ...node,
              style: { ...node.style, background: '#fef9c3', border: '2px solid #facc15' },
            }
          }

          if (isComplete) {
            return {
              ...node,
              style: { ...node.style, background: '#ede9fe', border: '2px solid #8b5cf6' },
            }
          }

          if (isAgent) {
            let background = '#fff'
            let border = '1px solid #ccc'
            if (event.status === 'STARTED') {
              background = '#c7d2fe'
              border = '2px solid #6366f1'
            } else if (event.status === 'FINISHED') {
              background = '#dcfce7'
              border = '2px solid #22c55e'
            }

            return {
              ...node,
              style: {
                ...node.style,
                background,
                border,
                animation: event.status === 'STARTED' ? 'pulse 1.5s infinite' : undefined,
              },
            }
          }

          return node
        })
      })
      return updated
    })
  }, [events, setNodes])

  const nodeLogs = selectedNodeId
    ? logs.filter((log) => log.agent_name.toLowerCase() === selectedNodeId)
    : []

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => handleNodeClick(node.id)}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>

      {selectedNodeId && (
        <div className="absolute top-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10 animate-fadeIn">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold">Logs: {selectedNodeId}</h2>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto text-xs space-y-1">
            {nodeLogs.length ? (
              nodeLogs.map((log, idx) => (
                <div key={idx} className="text-gray-800 border-b py-1">
                  <span className="text-gray-500 mr-2">{log.timestamp}</span>
                  <span>{log.message}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 italic">No logs for this node.</p>
            )}
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.6);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(99, 102, 241, 0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default function WorkflowTab() {
  const prompt = useAgentStreamStore((s) => s.prompt)

  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        {prompt ? <WorkflowCanvas /> : (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
            No workflow yet. Start by sending a prompt in the Chat tab.
          </div>
        )}
      </ReactFlowProvider>
    </div>
  )
}