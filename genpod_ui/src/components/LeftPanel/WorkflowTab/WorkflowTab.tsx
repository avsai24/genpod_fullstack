'use client'

import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react'
import { ReactFlow, 
    Background, 
    Controls, 
    ReactFlowProvider, 
    useNodesState, 
    useEdgesState, 
    Position, 
    MarkerType, 
    Node, Edge, Handle, Position as HandlePosition, NodeProps } from '@xyflow/react'

import '@xyflow/react/dist/style.css'
import { useAgentStreamStore } from '@/state/agentStreamStore'
import LogPanel from '@/components/LeftPanel/WorkflowTab/LogPanel'

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

// Inline custom SupervisorNode for dynamic bottom handles
const SupervisorNode = ({ data }: NodeProps) => {
  const assignedAgents: string[] = Array.isArray(data.assignedAgents) ? data.assignedAgents : []
  const isRunning = data.status === 'Running'
  const isComplete = data.status === 'Complete'

  const borderColor = isRunning ? '#F9995E' : isComplete ? '#22C55E' : '#C2C2C2'
  const textColor = isRunning ? '#F9995E' : isComplete ? '#22C55E' : '#E5E5E5'
  const animationClass = isRunning ? 'pulse-glow' : ''

  return (
    <div
      className={`rounded-xl px-6 py-4 shadow-md text-center relative w-[500px] ${animationClass}`}
      style={{
        background: '#1F1F1F',
        border: `3.5px solid ${borderColor}`,
        color: textColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
        gap: '8px',
        fontSize: 18
      }}
    >
      <div className="text-2xl font-semibold mb-2">{data.label}</div>
      <div className="text-sm mb-4">{data.status}</div>

      <Handle type="target" position={HandlePosition.Left} />
      <Handle type="source" position={HandlePosition.Right} />

      {(assignedAgents.length === 0 || assignedAgents.length === 1) && (
        <Handle type="source" position={HandlePosition.Bottom} id="bottom-0" style={{ left: '50%' }} />
      )}
      {assignedAgents.length > 1 &&
        assignedAgents.map((_, idx) => (
          <Handle
            key={`bottom-${idx}`}
            type="source"
            position={HandlePosition.Bottom}
            id={`bottom-${idx}`}
            style={{ left: `${((idx + 1) * 100) / (assignedAgents.length + 1)}%` }}
          />
        ))}
    </div>
  )
}

const nodeTypes = { supervisor: SupervisorNode }

function WorkflowCanvas() {
  const { prompt, workflow, logs, nodePositions, updateNodePosition } = useAgentStreamStore()
  const containerRef = useRef(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState(null)


  
  const getDefaultPositions = useCallback(() => {
    const containerWidth = containerRef.current?.offsetWidth || 1200
    const BASE_Y = 150
    const SUPERVISOR_WIDTH = 500
    const AGENT_WIDTH = 120
    const VERTICAL_SPACING = 200
  
    // Step 1: define base nodes
    const positions: Record<string, { x: number, y: number }> = {
      prompt: { x: containerWidth * 0.1, y: BASE_Y },
      supervisor: { x: containerWidth * 0.35, y: BASE_Y },
      complete: { x: containerWidth * 0.75, y: BASE_Y },
    }
  
    // Step 2: define other agents (excluding supervisor)
    const otherAgents = Object.keys(workflow?.agents || {}).filter(name => name !== 'supervisor')
    const supervisorPos = positions['supervisor']
  
    // Step 3: assign each agent a % left from supervisor
    otherAgents.forEach((agentId, idx) => {
      const percent = [0.25, 0.5, 0.75][idx] || 0.5
      const x = supervisorPos.x + (SUPERVISOR_WIDTH * percent) - (AGENT_WIDTH / 2)
      const y = supervisorPos.y + VERTICAL_SPACING
      positions[agentId] = { x, y }
    })
  
    return positions
  }, [workflow])

  const getNodeLabel = useCallback((id: string) => {
    const displayName = id === 'complete' ? 'Workflow' : id.charAt(0).toUpperCase() + id.slice(1)
    const getAgentCalls = (agentId: string) => {
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

    const nodes: Node[] = []
    const edges: Edge[] = []
    const defaultPositions = getDefaultPositions()
    const baseSuffix = prompt.replace(/\\s+/g, '-').toLowerCase().slice(0, 20) || 'default'
    let edgeCounter = 0

    const addNode = (
      id: string,
      type: string,
      label: React.ReactNode,
      status: string,
      assignedAgents: string[] = []
    ) => {
      const position = nodePositions[id] || defaultPositions[id]
      let sourcePosition = Position.Right
      let targetPosition = Position.Left
      let nodeType = undefined
      let nodeData: any = { label, status }
      if (id === 'supervisor') {
        nodeType = 'supervisor'
        nodeData = { label, status, assignedAgents }
        // Do NOT pass style for custom node
      }
      if (id === 'prompt') {
        sourcePosition = Position.Right
        targetPosition = Position.Left
      }
      if (id === 'complete') {
        sourcePosition = Position.Right
        targetPosition = Position.Left
      }
      if (id !== 'prompt' && id !== 'supervisor' && id !== 'complete') {
        sourcePosition = Position.Right
        targetPosition = Position.Top
      }
      const node: any = {
        id,
        data: nodeData,
        position,
        draggable: true,
      }
      if (nodeType) node.type = nodeType
      if (!nodeType) {
        node.style = {
          ...getNodeStyle(id, status),
          
        }
        node.className = status === 'Running' ? 'pulse-glow' : ''
        node.sourcePosition = sourcePosition
        node.targetPosition = targetPosition
      }
      nodes.push(node)
    }

    const labelPrompt = getNodeLabel('prompt')
    const statusPrompt = labelPrompt.props.children[1].props.children
    addNode('prompt', 'prompt', labelPrompt, statusPrompt)

    if (workflow.agents.supervisor) {
      const labelSupervisor = getNodeLabel('supervisor')
      const statusSupervisor = labelSupervisor.props.children[1].props.children
      // Only pass agents (not supervisor or complete/workflow)
      const assignedAgents = Object.keys(workflow.agents).filter(name => name !== 'supervisor' && name !== 'complete')
      addNode('supervisor', 'supervisor', labelSupervisor, statusSupervisor, assignedAgents)
      // prompt -> supervisor (right to left)
      edges.push({
        id: `e-prompt-supervisor-${baseSuffix}-${edgeCounter++}`,
        source: 'prompt',
        target: 'supervisor',
        type: 'smoothstep',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: getEdgeStyle()
      })
      // supervisor -> complete (right to left)
      edges.push({
        id: `e-supervisor-complete-${baseSuffix}-${edgeCounter++}`,
        source: 'supervisor',
        target: 'complete',
        type: 'smoothstep',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: getEdgeStyle()
      })
    }

    const labelComplete = getNodeLabel('complete')
    const statusComplete = labelComplete.props.children[1].props.children
    addNode('complete', 'workflow_success', labelComplete, statusComplete)

    // Supervisor -> agents (dynamic bottom division, with handle ids for multiple agents)
    const agentEntries = Object.entries(workflow.agents).filter(([name]) => name !== 'supervisor' && name !== 'complete')
    const agentCount = agentEntries.length
    agentEntries.forEach(([agentId], idx) => {
      const label = getNodeLabel(agentId)
      const status = label.props.children[1].props.children
      addNode(agentId, 'reviewer', label, status)
      // Always use sourceHandle: bottom-0 for single agent, bottom-i for multiple
      const handleId = agentCount === 1 ? 'bottom-0' : `bottom-${idx}`
      edges.push({
        id: `e-supervisor-${agentId}-${baseSuffix}-${edgeCounter++}`,
        source: 'supervisor',
        target: agentId,
        type: 'smoothstep',
        sourceHandle: handleId,
        targetPosition: Position.Top,
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

  const onNodeClick = useCallback((_: any, node: any) => setSelectedNodeId(node.id), [])
  const onNodeDragStop = useCallback((_: any, node: any) => updateNodePosition(node.id, node.position), [updateNodePosition])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0a0a]">
      {prompt ? (
        <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        fitView
        nodeTypes={nodeTypes}
      >
        <Background
        variant="dots"
        gap={20}
        size={2}
        color="#666"
      />
       <Controls className="custom-controls" />
      </ReactFlow>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-textSecondary">
          No workflow yet. Start a prompt in the Chat tab.
        </div>
      )}

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