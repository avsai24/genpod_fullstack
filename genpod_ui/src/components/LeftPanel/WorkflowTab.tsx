'use client'

import React, { useCallback } from 'react'
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

const initialNodes: Node[] = [
  {
    id: 'prompt',
    data: { label: 'User Prompt' },
    position: { x: 0, y: -100 },
    style: {
      padding: 10,
      background: '#f3f4f6',
      border: '1px solid #ccc',
      borderRadius: 8,
    },
  },
  {
    id: 'supervisor',
    data: { label: 'Supervisor' },
    position: { x: 0, y: 0 },
    style: { padding: 10 },
  },
  {
    id: 'planner',
    data: { label: 'Planner' },
    position: { x: 0, y: 100 },
    style: { padding: 10 },
  },
  {
    id: 'architect',
    data: { label: 'Architect' },
    position: { x: 0, y: 200 },
    style: { padding: 10 },
  },
  {
    id: 'coder',
    data: { label: 'Coder' },
    position: { x: 0, y: 300 },
    style: { padding: 10 },
  },
  {
    id: 'tester',
    data: { label: 'Tester' },
    position: { x: 0, y: 400 },
    style: { padding: 10 },
  },
  {
    id: 'reviewer',
    data: { label: 'Reviewer' },
    position: { x: 0, y: 500 },
    style: { padding: 10 },
  },
  {
    id: 'complete',
    data: { label: 'Workflow complete' },
    position: { x: 0, y: 600 },
    style: {
      padding: 10,
      background: '#f3f4f6',
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

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  React.useEffect(() => {
    const eventSource = new EventSource(
      `/api/agentStream?prompt=${encodeURIComponent('build a login app')}&user_id=testUser`
    )

    eventSource.addEventListener('event', (e) => {
      try {
        const payload = JSON.parse(e.data)
        const { agent_name, status } = payload
        const agentId = agent_name?.toLowerCase()

        setNodes((prevNodes) =>
            prevNodes.map((node) => {
              const nodeId = node.id
              const agentId = agent_name?.toLowerCase()
          
              const isPrompt = nodeId === 'prompt' && agentId === 'supervisor' && status === 'STARTED'
              const isSupervisor = nodeId === 'supervisor'
              const isComplete = nodeId === 'complete' && agentId === 'reviewer' && status === 'FINISHED'
              const isAgent = nodeId === agentId
          
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
          
              if (nodeId === agentId) {
                let background = '#fff'
                let border = '1px solid #ccc'
              
                if (status === 'STARTED') {
                  background = '#c7d2fe' // indigo
                  border = '2px solid #6366f1'
                } else if (status === 'FINISHED') {
                  background = '#dcfce7' // green
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
          
              if (isAgent) {
                let background = '#fff'
                let border = '1px solid #ccc'
          
                if (status === 'STARTED') {
                  background = '#c7d2fe'
                  border = '2px solid #6366f1'
                } else if (status === 'FINISHED') {
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
          )

      } catch (err) {
        console.error('[WorkflowTab] Failed to parse event:', e.data)
      }
    })

    return () => eventSource.close()
  }, [setNodes])

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
  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <WorkflowCanvas />
      </ReactFlowProvider>
    </div>
  )
}