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
    background: 'rgba(59, 130, 246, 0.1)',    // Accent color with opacity
    border: 'rgba(59, 130, 246, 0.3)',
    text: '#3B82F6'
  },
  supervisor: {
    background: 'rgba(34, 197, 94, 0.1)',    // Success color with opacity
    border: 'rgba(34, 197, 94, 0.3)',
    text: '#22C55E'
  },
  reviewer: {
    background: 'rgba(234, 179, 8, 0.1)',    // Warning color with opacity
    border: 'rgba(234, 179, 8, 0.3)',
    text: '#EAB308'
  },
  workflow_success: {
    background: 'rgba(239, 68, 68, 0.1)',    // Error color with opacity
    border: 'rgba(239, 68, 68, 0.3)',
    text: '#EF4444'
  }
}

const getNodeStyle = (type: 'prompt' | 'supervisor' | 'reviewer' | 'workflow_success') => {
  const base = {
    padding: '25px',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    width: 280,
    fontSize: 16,
    textAlign: 'center' as const,
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    background: 'var(--surface)',
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
        stroke: '#22C55E'  // Success color for supervisor connections
      }
    case 'reviewer':
      return {
        ...baseStyle,
        stroke: '#EAB308'  // Warning color for reviewer connections
      }
    default:
      return {
        ...baseStyle,
        stroke: '#3B82F6'  // Accent color for prompt connections
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
      return recentLogs.some(log => log.message.includes('working on:'))
    }

    const getCallsDisplay = (agentId: string) => {
      const calls = agentId === 'supervisor' ? getSupervisorCalls() : getAgentCalls(agentId)
      const isRunning = isAgentRunning(agentId)
      return (
        <div className="text-sm">
          <span className="text-textSecondary">
            {calls.completed}/{calls.total} tasks
          </span>
          {isRunning && (
            <span className="ml-2 text-accent animate-pulse">●</span>
          )}
        </div>
      )
    }

    const getStatusDisplay = (id: string) => {
      if (id === 'prompt') {
        return prompt ? (
          <div className="text-sm text-textSecondary mt-2">
            {prompt.length > 50 ? prompt.slice(0, 50) + '...' : prompt}
          </div>
        ) : null
      }

      if (id === 'complete') {
        const allAgents = Object.keys(workflow?.agents || {})
        const allCalls = allAgents.map(agentId => getAgentCalls(agentId))
        const totalTasks = allCalls.reduce((sum, count) => sum + count.total, 0)
        const completedTasks = allCalls.reduce((sum, count) => sum + count.completed, 0)
        const isComplete = totalTasks > 0 && totalTasks === completedTasks

        return (
          <div className="text-sm mt-2">
            <span className={isComplete ? 'text-success' : 'text-textSecondary'}>
              {completedTasks}/{totalTasks} tasks complete
            </span>
          </div>
        )
      }

      return getCallsDisplay(id)
    }

    return (
      <div>
        <div className="font-semibold">{displayName}</div>
        {getStatusDisplay(id)}
      </div>
    )
  }

  const addNode = (id: string, type: 'prompt' | 'supervisor' | 'reviewer' | 'workflow_success', label: React.ReactNode) => {
    const position = nodePositions[id] || getDefaultPositions()[id]
    if (!position) return

    const node: Node = {
      id,
      type: 'default',
      position,
      data: { label },
      style: getNodeStyle(type),
    }

    setNodes(nodes => [...nodes, node])
  }

  // Update nodes and edges when workflow changes
  useEffect(() => {
    if (!workflow) return

    // Clear existing nodes and edges
    setNodes([])
    setEdges([])

    // Add prompt node
    addNode('prompt', 'prompt', getNodeLabel('prompt'))

    // Add supervisor node
    if (workflow.agents.supervisor) {
      addNode('supervisor', 'supervisor', getNodeLabel('supervisor'))
    }

    // Add other agent nodes
    Object.keys(workflow.agents)
      .filter(name => name !== 'supervisor')
      .forEach(agentId => {
        addNode(agentId, 'reviewer', getNodeLabel(agentId))
      })

    // Add completion node
    addNode('complete', 'workflow_success', getNodeLabel('complete'))

    // Add edges
    const newEdges: Edge[] = []

    // Connect prompt to supervisor
    if (workflow.agents.supervisor) {
      newEdges.push({
        id: 'prompt-supervisor',
        source: 'prompt',
        target: 'supervisor',
        type: 'default',
        style: getEdgeStyle('prompt'),
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      })
    }

    // Connect supervisor to agents
    Object.keys(workflow.agents)
      .filter(name => name !== 'supervisor')
      .forEach(agentId => {
        newEdges.push({
          id: `supervisor-${agentId}`,
          source: 'supervisor',
          target: agentId,
          type: 'default',
          style: getEdgeStyle('supervisor'),
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        })
      })

    // Connect agents to completion
    Object.keys(workflow.agents)
      .filter(name => name !== 'supervisor')
      .forEach(agentId => {
        newEdges.push({
          id: `${agentId}-complete`,
          source: agentId,
          target: 'complete',
          type: 'default',
          style: getEdgeStyle('reviewer'),
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        })
      })

    setEdges(newEdges)
  }, [workflow, prompt, logs, nodePositions])

  return (
    <div ref={containerRef} className="w-full h-full bg-background">
      {workflow && Object.keys(workflow.agents || {}).length > 0 ? (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={(_, node) => {
            updateNodePosition(node.id, node.position)
          }}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#2A2A2A" gap={16} />
          <Controls />
        </ReactFlow>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-sm text-textSecondary">
          <div className="flex flex-col items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 6.1H3"/>
              <path d="M21 12.1H3"/>
              <path d="M15.5 18.1H3"/>
            </svg>
            <p>No workflow visualization yet.</p>
            <p>Start a prompt in the Chat tab to see the workflow.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function WorkflowTab() {
  return (
    <div className="w-full h-full bg-background">
      <ReactFlowProvider>
        <WorkflowCanvas />
      </ReactFlowProvider>
    </div>
  )
}