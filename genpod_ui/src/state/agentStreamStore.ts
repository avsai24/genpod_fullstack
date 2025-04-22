import { create } from 'zustand'
import { Node, Edge } from 'react-flow-renderer'

interface AgentData {
  status?: 'STARTED' | 'FINISHED'
  [key: string]: any
}

interface WorkflowConnection {
  source: string
  target: string
}

interface Workflow {
  agents: { [key: string]: AgentData }
  connections: WorkflowConnection[]
  completed?: boolean
}

interface Log {
  agent_name: string
  timestamp: string
  message: string
}

interface Subtask {
  agent: string
  task: string
  status?: 'PENDING' | 'STARTED' | 'FINISHED'
  parent?: string
  children?: string[]
  timestamp: string
}

interface WorkflowState {
  prompt: string
  agents: {
    [key: string]: Subtask
  }
  connections: {
    source: string
    target: string
    timestamp: string
  }[]
  completed: boolean
}

interface AgentStreamState {
  prompt: string
  answer: string
  logs: Log[]
  workflow: WorkflowState
  isStreaming: boolean
  startAgentStream: (message: string) => void
  reset: () => void
}

interface AgentStreamStore {
  prompt: string | null
  workflow: Workflow | null
  logs: Log[]
  nodePositions: { [key: string]: { x: number; y: number } }
  isLayoutLocked: boolean
  setPrompt: (prompt: string) => void
  setWorkflow: (workflow: Workflow) => void
  addLog: (log: Log) => void
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void
  toggleLayoutLock: () => void
  startAgentStream: (message: string) => Promise<void>
  reset: () => void
}

const initialWorkflowState: WorkflowState = {
  prompt: '',
  agents: {},
  connections: [],
  completed: false
}

export const useAgentStreamStore = create<AgentStreamStore>((set) => ({
  prompt: null,
  workflow: null,
  logs: [],
  nodePositions: {},
  isLayoutLocked: false,
  setPrompt: (prompt) => set({ prompt }),
  setWorkflow: (workflow) => set({ workflow }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  updateNodePosition: (nodeId, position) =>
    set((state) => ({
      nodePositions: {
        ...state.nodePositions,
        [nodeId]: position,
      },
    })),
  toggleLayoutLock: () =>
    set((state) => ({
      isLayoutLocked: !state.isLayoutLocked,
    })),
  startAgentStream: async (message: string) => {
    console.log('🚀 Starting agent stream with message:', message)
    set({
      prompt: message,
      answer: '',
      logs: [],
      workflow: {
        ...initialWorkflowState,
        prompt: message
      },
      isStreaming: true,
    })

    try {
    const response = await fetch(`/api/chat/stream?message=${encodeURIComponent(message)}`)
      console.log('📡 SSE connection established:', response.status)
    const reader = response.body!.getReader()
    const decoder = new TextDecoder('utf-8')

    let answerBuffer = ''
    let partialLine = ''

    while (true) {
      const { value, done } = await reader.read()
        if (done) {
          console.log('✅ SSE stream completed')
          break
        }
      const chunk = decoder.decode(value, { stream: true })
        console.log('📦 Received SSE chunk:', chunk)

      const lines = (partialLine + chunk).split('\n')
      partialLine = lines.pop() || ''

      for (const raw of lines) {
        const line = raw.trim()
          if (!line) continue

          if (line.startsWith('event:')) {
            const eventType = line.replace('event:', '').trim()
            const nextLine = lines[lines.indexOf(raw) + 1]

            if (nextLine && nextLine.startsWith('data:')) {
              const dataStr = nextLine.replace('data:', '').trim()

        try {
                const data = JSON.parse(dataStr)
                console.log(`📨 Processing SSE event: ${eventType}`, data)

                // Add log entry
          if (eventType === 'log') {
            set((state) => ({
              logs: [
                ...state.logs,
                {
                  message: data.message,
                  agent_name: data.agent_name || 'System',
                  timestamp: data.timestamp || new Date().toLocaleTimeString('en-US', { hour12: false }),
                },
              ],
            }))

                  // 🧠 Extract subtasks from System log early
                  if (data.agent_name === 'System' && data.message.includes('subtasks')) {
                    const parsed = JSON.parse(data.message)
                    if (parsed.subtasks) {
                      set((state) => {
                        const currentWorkflow = { ...state.workflow }
                        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false })

                        parsed.subtasks.forEach((task: any) => {
                          const agentName = task.agent.toLowerCase()

                          if (!currentWorkflow.agents[agentName]) {
                            currentWorkflow.agents[agentName] = {
                              agent: agentName,
                              task: task.task,
                              status: 'PENDING',
                              timestamp,
                              parent: 'supervisor',
                              children: []
                            }

                            currentWorkflow.connections.push({
                              source: 'supervisor',
                              target: agentName,
                              timestamp
                            })
                          }
                        })

                        return { workflow: currentWorkflow }
                      })
                    }
                  }
                }

                // Handle agent status updates
          else if (eventType === 'event') {
            set((state) => {
                    const currentWorkflow = { ...state.workflow }
                    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false })
                    const agentName = data.agent_name.toLowerCase()

                    if (!currentWorkflow.agents[agentName]) {
                      currentWorkflow.agents[agentName] = {
                        agent: agentName,
                        task: data.task || '',
                        status: data.status.toUpperCase(),
                        timestamp,
                        children: []
                      }

                      if (agentName === 'supervisor') {
                        currentWorkflow.connections.push({
                          source: 'prompt',
                          target: 'supervisor',
                          timestamp
                        })
                      } else if (currentWorkflow.agents['supervisor']) {
                        currentWorkflow.agents['supervisor'].children = [
                          ...(currentWorkflow.agents['supervisor'].children || []),
                          agentName
                        ]
                        currentWorkflow.connections.push({
                          source: 'supervisor',
                          target: agentName,
                          timestamp
                        })
                      }
              } else {
                      currentWorkflow.agents[agentName] = {
                        ...currentWorkflow.agents[agentName],
                        status: data.status.toUpperCase(),
                        task: data.task || currentWorkflow.agents[agentName].task
                      }

                      if (agentName === 'supervisor' && data.status.toUpperCase() === 'FINISHED') {
                        currentWorkflow.completed = true
                        currentWorkflow.connections.push({
                          source: 'supervisor',
                          target: 'complete',
                          timestamp
                        })
                      }
                    }

                    return { workflow: currentWorkflow }
                  })
          }

                // Handle final answer
          else if (eventType === 'final_answer') {
            answerBuffer += data.content + '\n'
                  console.log('💬 Updated answer buffer:', answerBuffer)
            set({ answer: answerBuffer })
          }
        } catch (err) {
                console.error('❌ SSE parse error:', err, 'Raw data:', dataStr)
        }
      }
    }
        }
      }
    } catch (err) {
      console.error('❌ SSE stream error:', err)
    } finally {
      console.log('🏁 Stream ended, setting isStreaming to false')
      set({ isStreaming: false })
    }
  },

  reset: () => set({ prompt: null, workflow: null, logs: [], nodePositions: {}, isLayoutLocked: false }),
}))