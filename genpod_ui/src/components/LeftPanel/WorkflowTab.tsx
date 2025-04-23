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

const nodeTypes = {}
const edgeTypes = {}

const NODE_COLORS = {
  prompt: {
    background: 'rgba(71, 58, 0, 0.55)',    // Subtle golden brown
    border: 'rgba(255, 215, 0, 0.3)',
    text: '#FFD700'
  },
  supervisor: {
    background: 'rgba(0, 71, 35, 0.55)',    // Deep forest green
    border: 'rgba(0, 255, 127, 0.2)',
    text: '#00FF7F'
  },
  reviewer: {
    background: 'rgba(13, 115, 119, 0.55)', // Teal
    border: 'rgba(20, 184, 166, 0.3)',
    text: '#2DD4BF'
  },
  workflow_success: {
    background: 'rgba(75, 0, 130, 0.55)',   // Deep violet
    border: 'rgba(147, 112, 219, 0.2)',
    text: '#B19CD9'
  }
}

const getNodeStyle = (type: 'prompt' | 'supervisor' | 'reviewer' | 'workflow_success') => {
  const base = {
    padding: '25px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    width: 280,
    fontSize: 16,
    textAlign: 'center' as const,
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    background: 'rgba(20, 42, 45, 0.7)',
  }

  const colors = NODE_COLORS[type] || NODE_COLORS.reviewer
  return {
    ...base,
    borderColor: colors.border,
    color: colors.text,
  }
}

// Update edge styles based on source node type
const getEdgeStyle = (sourceType: string) => {
  const baseStyle = {
    strokeWidth: 1,
    opacity: 0.3,
    strokeDasharray: '4 4'
  }

  switch(sourceType) {
    case 'supervisor':
      return {
        ...baseStyle,
        stroke: '#00FF7F'  // Green for supervisor connections
      }
    case 'reviewer':
      return {
        ...baseStyle,
        stroke: '#0095FF'  // Blue for reviewer connections
      }
    default:
      return {
        ...baseStyle,
        stroke: '#FFD700'  // Gold for prompt connections
      }
  }
}

function WorkflowCanvas() {
  const { prompt, workflow, logs, nodePositions, updateNodePosition } = useAgentStreamStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [showPromptModal, setShowPromptModal] = useState(false)

  // Fixed default positions for reset layout
  const getDefaultPositions = useCallback(() => {
    const containerWidth = containerRef.current?.offsetWidth || 1200
    const BASE_Y = 150
    const AGENTS_Y = BASE_Y + 200
    const MIN_SPACING = 200  // Minimum space between nodes
    
    // Calculate dynamic spacing based on container width
    const availableWidth = containerWidth - 200  // 100px padding on each side
    const mainNodesCount = 3  // Prompt, Supervisor, Success
    const agentsCount = Object.keys(workflow?.agents || {}).filter(name => name !== 'supervisor').length
    const maxNodesInRow = Math.max(mainNodesCount, agentsCount)
    
    // Calculate spacing that fits the container
    const NODE_SPACING = Math.max(MIN_SPACING, Math.min(300, (availableWidth - 250) / (maxNodesInRow - 1)))
    const START_X = (containerWidth - ((maxNodesInRow - 1) * NODE_SPACING + 250)) / 2

    const positions: { [key: string]: { x: number, y: number } } = {
      prompt: { x: START_X, y: BASE_Y },
      supervisor: { x: START_X + NODE_SPACING, y: BASE_Y },
      complete: { x: START_X + (NODE_SPACING * 2), y: BASE_Y }
    }

    // Position agents in a row below with equal spacing
    const otherAgents = Object.keys(workflow?.agents || {}).filter(name => name !== 'supervisor')
    if (otherAgents.length > 0) {
      // Calculate agent row start position to center it
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

  // Add resize observer to update layout when container size changes
  useEffect(() => {
    const updateLayout = () => {
      if (!containerRef.current) return
      const defaultPositions = getDefaultPositions()
      setNodes(nodes => 
        nodes.map(node => ({
          ...node,
          position: nodePositions[node.id] || defaultPositions[node.id]
        }))
      )
    }

    const resizeObserver = new ResizeObserver(updateLayout)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    return () => resizeObserver.disconnect()
  }, [getDefaultPositions, nodePositions])

  // Node label helper function
  const getNodeLabel = (id: string) => {
    const displayName = id === 'complete' ? 'Workflow' : id.charAt(0).toUpperCase() + id.slice(1)
    
    // Get agent call counts based on status
    const getAgentCalls = (agentId: string) => {
      if (!workflow?.agents[agentId]) return { total: 0, completed: 0 }
      
      // Count tasks from logs
      const agentLogs = logs.filter(log => log.agent_name.toLowerCase() === agentId.toLowerCase())
      const totalTasks = agentLogs.filter(log => log.message.includes('working on:')).length
      const completedTasks = agentLogs.filter(log => log.message.includes('completed:')).length
      
      return {
        total: totalTasks || 1, // Fallback to 1 if no logs yet
        completed: completedTasks
      }
    }

    // For supervisor, count total agents and completed ones
    const getSupervisorCalls = () => {
      if (!workflow?.agents?.supervisor) return { total: 0, completed: 0 }
      
      // Get all agent tasks and completions
      const agentCounts = Object.keys(workflow.agents)
        .filter(name => name !== 'supervisor')
        .map(agentId => getAgentCalls(agentId))
      
      // Sum up all tasks and completions
      const total = agentCounts.reduce((sum, count) => sum + count.total, 0)
      const completed = agentCounts.reduce((sum, count) => sum + count.completed, 0)
      
      return { total, completed }
    }

    // Check if an agent is currently running based on recent logs
    const isAgentRunning = (agentId: string) => {
      const recentLogs = logs
        .filter(log => log.agent_name.toLowerCase() === agentId.toLowerCase())
        .slice(-5) // Look at last 5 logs
      
      // Check if we have a "working on" log more recent than the last "completed" log
      const lastWorkingIndex = recentLogs.findLastIndex(log => log.message.includes('working on:'))
      const lastCompletedIndex = recentLogs.findLastIndex(log => log.message.includes('completed:'))
      
      return lastWorkingIndex > lastCompletedIndex
    }

    // Get calls count display
    const getCallsDisplay = (agentId: string) => {
      const calls = agentId === 'supervisor' ? 
        getSupervisorCalls() : 
        getAgentCalls(agentId)
      return `${calls.completed}/${calls.total}`
    }

    // Get status display
    const getStatusDisplay = (id: string) => {
      if (id === 'prompt') return 'Ready'
      
      if (id === 'complete') {
        const allAgentCounts = Object.keys(workflow?.agents || {})
          .filter(name => name !== 'supervisor')
          .map(agentId => getAgentCalls(agentId))
        
        const allTasksComplete = allAgentCounts.every(counts => 
          counts.completed === counts.total && counts.total > 0
        )
        
        return workflow?.completed && allTasksComplete ? 'Complete' : 'idle'
      }

      // For supervisor
      if (id === 'supervisor') {
        const { total, completed } = getSupervisorCalls()
        const anyAgentRunning = Object.keys(workflow?.agents || {})
          .filter(name => name !== 'supervisor')
          .some(agentId => isAgentRunning(agentId))

        if (anyAgentRunning) return 'Running'
        if (completed < total) return 'idle'
        return completed === total ? 'Complete' : 'idle'
      }

      // For regular agents
      const counts = getAgentCalls(id)
      if (isAgentRunning(id)) return 'Running'
      if (counts.completed < counts.total) return 'idle'
      return counts.completed === counts.total ? 'Complete' : 'idle'
    }

    return (
      <div className="flex flex-col items-center">
        <div className="text-2xl font-semibold mb-2">{displayName}</div>
        <div className="text-sm opacity-60 mb-4">
          {getStatusDisplay(id)}
        </div>
        {id !== 'prompt' && id !== 'complete' && (
          <div className="text-sm opacity-80 space-y-1">
            <div>LangChain</div>
            <div>{getCallsDisplay(id)}</div>
          </div>
        )}
        {(id === 'prompt' || id === 'complete') && (
          <div className="text-sm opacity-80 space-y-1">
            <div>&nbsp;</div>
            <div>&nbsp;</div>
          </div>
        )}
      </div>
    )
  }

  const { flowNodes, flowEdges } = useMemo(() => {
    if (!workflow) return { flowNodes: [], flowEdges: [] }

    const nodes: Node[] = []
    const edges: Edge[] = []
    const defaultPositions = getDefaultPositions()

    // Helper function for node creation
    const addNode = (id: string, type: 'prompt' | 'supervisor' | 'reviewer' | 'workflow_success', label: React.ReactNode) => {
      const position = nodePositions[id] || defaultPositions[id]
      const status = getNodeLabel(id).props.children[1].props.children
      
      nodes.push({
        id,
        data: { 
          label,
          status
        },
        position,
        style: {
          ...getNodeStyle(type),
          animation: status === 'Running' ? 'blink 1.5s ease-in-out infinite' : 'none'
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        draggable: true
      })
    }

    // Add main workflow nodes
    addNode('prompt', 'prompt', getNodeLabel('prompt'))
    
    if (workflow.agents['supervisor']) {
      const supervisorAgent = workflow.agents['supervisor']
      addNode('supervisor', 'supervisor', getNodeLabel('supervisor'))
      
      edges.push({
        id: 'e-prompt-supervisor',
        source: 'prompt',
        target: 'supervisor',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: getEdgeStyle('prompt'),
      })
    }

    // Always show workflow node
    addNode('complete', 'workflow_success', getNodeLabel('complete'))
    
    if (workflow.agents['supervisor']) {
      edges.push({
        id: 'e-supervisor-complete',
        source: 'supervisor',
        target: 'complete',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: getEdgeStyle('supervisor'),
      })
    }

    // Add agent nodes
    const otherAgents = Object.entries(workflow.agents).filter(([name]) => name !== 'supervisor')
    otherAgents.forEach(([agentId, agentData]) => {
      addNode(agentId, 'reviewer', getNodeLabel(agentId))
      
      edges.push({
        id: `e-supervisor-${agentId}`,
        source: 'supervisor',
        target: agentId,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: getEdgeStyle('supervisor'),
      })
    })

    return { flowNodes: nodes, flowEdges: edges }
  }, [workflow, nodePositions, getDefaultPositions])

  useEffect(() => {
    if (flowNodes.length > 0 || flowEdges.length > 0) {
      setNodes(flowNodes)
      setEdges(flowEdges)
    }
  }, [flowNodes, flowEdges])

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.id === 'prompt') {
      setShowPromptModal(true)
    } else {
      setSelectedNodeId(node.id)
    }
  }, [])

  const nodeLogs = useMemo(() => {
    return selectedNodeId
      ? logs.filter((l) => l.agent_name.toLowerCase() === selectedNodeId)
      : []
  }, [selectedNodeId, logs])

  // Handle node drag
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    updateNodePosition(node.id, node.position)
  }, [updateNodePosition])

  const flowProps = useMemo(() => ({
    nodes,
    edges,
    nodeTypes,
    edgeTypes,
    onNodesChange,
    onEdgesChange,
    onNodeClick: handleNodeClick,
    onNodeDragStop,
    fitView: true,
  }), [nodes, edges, onNodesChange, onEdgesChange, handleNodeClick, onNodeDragStop])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0a0a]">
      <ReactFlow 
        {...flowProps}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        fitView
        fitViewOptions={{ 
          padding: 0.2,
          includeHiddenNodes: true,
          minZoom: 0.5,
          maxZoom: 1.5
        }}
      >
        <Background color="#333" gap={20} size={1} />
        <Controls className="text-white" />
      </ReactFlow>

      <button
        onClick={getDefaultPositions}
        className="absolute top-4 left-4 z-10 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md border border-zinc-600/30 transition-colors duration-200"
      >
        Reset Layout
      </button>

      {showPromptModal && (
        <div className="absolute top-4 right-4 w-96 bg-gray-900/70 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-lg p-4 z-10 animate-fadeIn text-white">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold">Prompt</h2>
            <button onClick={() => setShowPromptModal(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <pre className="text-xs max-h-72 overflow-y-auto whitespace-pre-wrap text-gray-300">{prompt}</pre>
        </div>
      )}

      {selectedNodeId && selectedNodeId !== 'prompt' && (
        <div className="absolute top-4 right-4 w-96 bg-gray-900/70 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-lg p-4 z-10 animate-fadeIn text-white">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold">Logs: {selectedNodeId}</h2>
            <button onClick={() => setSelectedNodeId(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="max-h-72 overflow-y-auto text-xs space-y-1">
            {nodeLogs.length ? nodeLogs.map((log, idx) => (
              <div key={idx}>
                <span className="text-gray-500 mr-2">{log.timestamp}</span>
                <span className="text-gray-300">{log.message}</span>
              </div>
            )) : <p className="italic text-gray-600">No logs found.</p>}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
            box-shadow: 0 0 15px currentColor;
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
            box-shadow: 0 0 25px currentColor;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .react-flow__node {
          transition: transform 0.2s ease;
        }
        .react-flow__node:hover {
          transform: translateY(-2px);
        }
        .react-flow__edge {
          transition: stroke-opacity 0.2s ease;
        }
        .react-flow__edge:hover {
          stroke-opacity: 1 !important;
        }
        @keyframes blink {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 20px currentColor;
          }
          50% {
            opacity: 0.7;
            box-shadow: 0 0 30px currentColor;
          }
        }
      `}</style>
    </div>
  )
}

export default function WorkflowTab() {
  const prompt = useAgentStreamStore((s) => s.prompt)

  return (
    <ReactFlowProvider>
      {prompt ? <WorkflowCanvas /> : (
        <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">
          No workflow yet. Start with a prompt.
        </div>
      )}
    </ReactFlowProvider>
  )
}