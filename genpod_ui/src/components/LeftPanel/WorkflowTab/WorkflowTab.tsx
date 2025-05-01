'use client'

import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  Node,
  Edge,
  Position,
  MarkerType,
} from 'react-flow-renderer'
import { useAgentStreamStore } from '@/state/agentStreamStore'
import LogPanel from '@/components/LeftPanel/WorkflowTab/LogPanel'

const nodeTypes = {}
const edgeTypes = {}

const getNodeStyle = (id, status) => {
  let style = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    borderRadius: '12px',
    border: '3.5px solid #C2C2C2',
    fontSize: 16,
    textAlign: 'center',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    background: '#1F1F1F',
    color: '#E5E5E5',
    width: 240,
    minHeight: 120,
    gap: '4px',
  }

  if (id === 'supervisor') {
    style = {
      ...style,
      padding: '28px',
      width: 500,
      fontSize: 18,
      gap: '8px',
    }
  }

  if (id === 'prompt' || id === 'complete') {
    style = {
      ...style,
      width: 190,
      padding: '16px',
      minHeight: 100,
      gap: '2px',
    }
  }

  if (id === 'prompt') {
    style.color = '#22C55E'
    style.border = '3.5px solid #22C55E'
  } else if (status === 'Running') {
    style.color = '#F9995E'
    style.border = '3.5px solid #F9995E'
  } else if (status === 'Complete') {
    style.color = '#22C55E'
    style.border = '3.5px solid #22C55E'
  }

  return style
}

const getEdgeStyle = () => ({
  strokeWidth: 3,
  opacity: 1,
  strokeDasharray: '6 4',
  stroke: '#BFBFBF'
})

function WorkflowCanvas() {
  const { prompt, workflow, logs, nodePositions, updateNodePosition } = useAgentStreamStore()
  const containerRef = useRef(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNodeId, setSelectedNodeId] = useState(null)

  const getDefaultPositions = useCallback(() => {
    const containerWidth = containerRef.current?.offsetWidth || 1200
    const BASE_Y = 150
    const AGENTS_Y = BASE_Y + 200
    const MIN_SPACING = 200
    const availableWidth = containerWidth - 200
    const mainNodesCount = 3
    const agentsCount = Object.keys(workflow?.agents || {}).filter(name => name !== 'supervisor').length
    const maxNodesInRow = Math.max(mainNodesCount, agentsCount)
    const NODE_SPACING = Math.max(MIN_SPACING, Math.min(300, (availableWidth - 250) / (maxNodesInRow - 1)))
    const START_X = (containerWidth - ((maxNodesInRow - 1) * NODE_SPACING + 250)) / 2

    const positions = {
      prompt: { x: START_X, y: BASE_Y },
      supervisor: { x: START_X + NODE_SPACING, y: BASE_Y },
      complete: { x: START_X + (NODE_SPACING * 2), y: BASE_Y }
    }

    const otherAgents = Object.keys(workflow?.agents || {}).filter(name => name !== 'supervisor')
    if (otherAgents.length > 0) {
      const agentRowWidth = (otherAgents.length - 1) * NODE_SPACING
      const agentStartX = (containerWidth - agentRowWidth) / 2
      otherAgents.forEach((agentId, idx) => {
        positions[agentId] = {
          x: agentStartX + (NODE_SPACING * idx),
          y: AGENTS_Y
        }
      })
    }

    return positions
  }, [workflow])

  const getNodeLabel = useCallback((id) => {
    const displayName = id === 'complete' ? 'Workflow' : id.charAt(0).toUpperCase() + id.slice(1)
    const getAgentCalls = (agentId) => {
      const agentLogs = logs.filter(log => log.agent_name.toLowerCase() === agentId.toLowerCase())
      const total = agentLogs.filter(log => log.message.toLowerCase().includes('working on task')).length
      const completed = agentLogs.filter(log => log.message.toLowerCase().includes('completed task')).length
      return { total: total || 1, completed }
    }
    const getSupervisorCalls = () => {
      const agentCounts = Object.keys(workflow?.agents || {})
        .filter(name => name !== 'supervisor' && name !== 'complete')
        .map(id => getAgentCalls(id))
      return {
        total: agentCounts.reduce((sum, c) => sum + c.total, 0),
        completed: agentCounts.reduce((sum, c) => sum + c.completed, 0)
      }
    }
    const isAgentRunning = (agentId) => {
      const recent = logs.filter(l => l.agent_name.toLowerCase() === agentId.toLowerCase()).slice(-5)
      const wIdx = recent.findLastIndex(l => l.message.toLowerCase().includes('working on task'))
      const cIdx = recent.findLastIndex(l => l.message.toLowerCase().includes('completed task'))
      return wIdx > cIdx
    }
    const getStatus = (id) => {
      if (id === 'prompt') return 'Ready'
      if (id === 'complete') {
        const allDone = Object.keys(workflow?.agents || {})
          .filter(name => name !== 'supervisor')
          .map(id => getAgentCalls(id))
          .every(c => c.completed === c.total && c.total > 0)
        const logComplete = logs.some(
          log => log.agent_name.toLowerCase() === 'complete' &&
          log.message.toLowerCase().includes('finished')
        )
        return logComplete && allDone ? 'Complete' : 'idle'
      }
      if (id === 'supervisor') {
        const { total, completed } = getSupervisorCalls()
        const anyRunning = Object.keys(workflow?.agents || {})
          .filter(n => n !== 'supervisor')
          .some(id => isAgentRunning(id))
        if (anyRunning) return 'Running'
        if (completed < total) return 'idle'
        return completed === total ? 'Complete' : 'idle'
      }
      const { total, completed } = getAgentCalls(id)
      if (isAgentRunning(id)) return 'Running'
      return completed === total ? 'Complete' : 'idle'
    }

    const callsDisplay = id === 'supervisor'
      ? getSupervisorCalls()
      : id !== 'prompt' && id !== 'complete'
        ? getAgentCalls(id)
        : null

    return (
      <div className="flex flex-col items-center">
        <div className="text-2xl font-semibold mb-2">{displayName}</div>
        <div className="text-sm opacity-60 mb-4">{getStatus(id)}</div>
        {callsDisplay && (
          <div className="text-sm opacity-80 space-y-1">
            <div>LangChain</div>
            <div>{callsDisplay.completed}/{callsDisplay.total}</div>
          </div>
        )}
      </div>
    )
  }, [workflow, logs])

  const { flowNodes, flowEdges } = useMemo(() => {
    if (!workflow || !prompt) return { flowNodes: [], flowEdges: [] }

    const nodes = []
    const edges = []
    const defaultPositions = getDefaultPositions()
    const baseSuffix = prompt.replace(/\\s+/g, '-').toLowerCase().slice(0, 20) || 'default'
    let edgeCounter = 0

    const addNode = (id, type, label, status) => {
      const position = nodePositions[id] || defaultPositions[id]
      nodes.push({
        id,
        data: { label, status },
        position,
        style: { ...getNodeStyle(id, status), animation: status === 'Running' ? 'blink 1.5s ease-in-out infinite' : 'none' },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        draggable: true
      })
    }

    const labelPrompt = getNodeLabel('prompt')
    const statusPrompt = labelPrompt.props.children[1].props.children
    addNode('prompt', 'prompt', labelPrompt, statusPrompt)

    if (workflow.agents.supervisor) {
      const labelSupervisor = getNodeLabel('supervisor')
      const statusSupervisor = labelSupervisor.props.children[1].props.children
      addNode('supervisor', 'supervisor', labelSupervisor, statusSupervisor)

      edges.push({
        id: `e-prompt-supervisor-${baseSuffix}-${edgeCounter++}`,
        source: 'prompt',
        target: 'supervisor',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: getEdgeStyle()
      })

      edges.push({
        id: `e-supervisor-complete-${baseSuffix}-${edgeCounter++}`,
        source: 'supervisor',
        target: 'complete',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: getEdgeStyle()
      })
    }

    const labelComplete = getNodeLabel('complete')
    const statusComplete = labelComplete.props.children[1].props.children
    addNode('complete', 'workflow_success', labelComplete, statusComplete)

    Object.entries(workflow.agents)
      .filter(([name]) => name !== 'supervisor')
      .forEach(([agentId]) => {
        const label = getNodeLabel(agentId)
        const status = label.props.children[1].props.children
        addNode(agentId, 'reviewer', label, status)
        edges.push({
          id: `e-supervisor-${agentId}-${baseSuffix}-${edgeCounter++}`,
          source: 'supervisor',
          target: agentId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: getEdgeStyle()
        })
      })

    return { flowNodes: nodes, flowEdges: edges }
  }, [workflow, prompt, nodePositions, getDefaultPositions, getNodeLabel])

  useEffect(() => {
    if (flowNodes.length > 0 || flowEdges.length > 0) {
      setNodes(flowNodes)
      setEdges(flowEdges)
    }
  }, [flowNodes, flowEdges])

  const onNodeClick = useCallback((_, node) => setSelectedNodeId(node.id), [])
  const onNodeDragStop = useCallback((_, node) => updateNodePosition(node.id, node.position), [updateNodePosition])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0a0a]">
      {prompt ? (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          fitView
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-textSecondary">
          No workflow yet. Start a prompt in the Chat tab.
        </div>
      )}

      <button onClick={() => {
        const defaults = getDefaultPositions()
        setNodes(nodes => nodes.map(n => ({ ...n, position: nodePositions[n.id] || defaults[n.id] })))
      }} className="absolute top-4 left-4 z-10 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md border border-zinc-600/30 transition-colors duration-200">
        Reset Layout
      </button>

      {selectedNodeId && (
        <LogPanel
          title={selectedNodeId === 'prompt' ? 'Prompt' : selectedNodeId === 'complete' ? 'Workflow Status' : `Logs: ${selectedNodeId}`}
          content={logs.filter(l => l.agent_name.toLowerCase() === selectedNodeId).map(log => `${log.timestamp} - ${log.message}`)}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  )
}

export default function WorkflowTab() {
  const prompt = useAgentStreamStore(s => s.prompt)
  return (
    <ReactFlowProvider>
      {prompt ? <WorkflowCanvas /> : (
        <div className="h-full w-full flex items-center justify-center text-sm text-textSecondary bg-background">
          No workflow yet. Start a prompt in the Chat tab.
        </div>
      )}
    </ReactFlowProvider>
  )
}