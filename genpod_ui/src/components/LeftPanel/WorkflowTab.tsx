'use client'

import React, { useEffect, useCallback } from 'react'
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

const initialNodes: Node[] = [
  {
    id: 'prompt',
    data: { label: 'Prompt' },
    position: { x: 0, y: -100 },
    style: {
      padding: 10,
      background: '#fef9c3', // yellow-100
      border: '1px solid #facc15', // yellow-400
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

  const prompt = useAgentStreamStore((s) => s.prompt)
  const events = useAgentStreamStore((s) => s.events)

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  useEffect(() => {
    // Reset to default nodes when prompt changes
    setNodes(initialNodes)
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
              style: {
                ...node.style,
                background: '#fef9c3',
                border: '2px solid #facc15',
                padding: 10,
                borderRadius: 8,
              },
            }
          }
  
          if (isComplete) {
            return {
              ...node,
              style: {
                ...node.style,
                background: '#ede9fe',
                border: '2px solid #8b5cf6',
                padding: 10,
                borderRadius: 8,
              },
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
                padding: 10,
                borderRadius: 8,
              },
            }
          }
  
          return node
        })
      })
  
      return updated
    })
  }, [events, setNodes])
  
  
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}

export default function WorkflowTab() {
  const prompt = useAgentStreamStore((s) => s.prompt)

  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        {prompt ? (
          <WorkflowCanvas />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
            No workflow yet. Start by sending a prompt in the Chat tab.
          </div>
        )}
      </ReactFlowProvider>
    </div>
  )
}