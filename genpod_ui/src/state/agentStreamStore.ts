import { create } from 'zustand'

// ─── Types ─────────────────────────────────────────────────────────────
interface Metric { name: string; value: string }
interface TokenModel {
  model: string
  calls: number
  input_tokens: string
  output_tokens: string
  total_cost: string
}
interface MetricsData {
  project_overview: Metric[]
  planned_tasks: Metric[]
  issues: Metric[]
  agent_state: Metric[]
  token_summary: Metric[]
  token_by_model: TokenModel[]
}

interface Log {
  agent_name: string
  timestamp: string
  message: string
}

interface WorkflowConnection {
  source: string
  target: string
  timestamp: string
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
  agents: { [key: string]: Subtask }
  connections: WorkflowConnection[]
  completed: boolean
}

// ─── Main Zustand Store Interface ─────────────────────────────────────
interface AgentStreamStore {
  prompt: string | null
  workflow: WorkflowState | null
  logs: Log[]
  nodePositions: { [key: string]: { x: number; y: number } }
  isLayoutLocked: boolean
  answerChunks: string[]
  isStreaming: boolean
  metrics: MetricsData | null

  setPrompt: (prompt: string) => void
  setWorkflow: (workflow: WorkflowState) => void
  addLog: (log: Log) => void
  pushAnswerChunk: (chunk: string) => void
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void
  toggleLayoutLock: () => void
  setMetrics: (data: MetricsData) => void
  startAgentStream: (message: string) => Promise<void>
  reset: () => void
}

// ─── Initial Workflow State ────────────────────────────────────────────
const initialWorkflowState: WorkflowState = {
  prompt: '',
  agents: {},
  connections: [],
  completed: false
}

// ─── Zustand Store ─────────────────────────────────────────────────────
export const useAgentStreamStore = create<AgentStreamStore>((set, get) => ({
  prompt: null,
  workflow: null,
  logs: [],
  nodePositions: {},
  isLayoutLocked: false,
  answerChunks: [],
  isStreaming: false,
  metrics: null,

  setPrompt: (prompt) => set({ prompt }),
  setWorkflow: (workflow) => set({ workflow }),
  setMetrics: (data) => set({ metrics: data }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  pushAnswerChunk: (chunk) =>
    set((state) => ({ answerChunks: [...state.answerChunks, chunk] })),
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
      answerChunks: [],
      logs: [],
      workflow: { ...initialWorkflowState, prompt: message },
      isStreaming: true,
    })

    try {
      const response = await fetch(`/api/chat/stream?message=${encodeURIComponent(message)}`)
      const reader = response.body!.getReader()
      const decoder = new TextDecoder('utf-8')

      let partialLine = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) {
          console.log('✅ SSE stream completed')
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = (partialLine + chunk).split('\n')
        partialLine = lines.pop() || ''

        for (let i = 0; i < lines.length; i++) {
          const raw = lines[i].trim()
          if (!raw) continue

          if (raw.startsWith('event:')) {
            const eventType = raw.replace('event:', '').trim()
            const nextLine = lines[i + 1]

            if (nextLine?.startsWith('data:')) {
              const dataStr = nextLine.replace('data:', '').trim()

              try {
                const data = JSON.parse(dataStr)
                console.log(`📨 Processing SSE event: ${eventType}`, data)

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
                } else if (eventType === 'event') {
                  set((state) => {
                    const currentWorkflow = { ...state.workflow }
                    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false })
                    const agentName = data.agent_name.toLowerCase()

                    if (!currentWorkflow?.agents[agentName]) {
                      currentWorkflow!.agents[agentName] = {
                        agent: agentName,
                        task: data.task || '',
                        status: data.status.toUpperCase(),
                        timestamp,
                        children: []
                      }
                    } else {
                      currentWorkflow!.agents[agentName].status = data.status.toUpperCase()
                    }

                    return { workflow: currentWorkflow }
                  })
                } else if (eventType === 'final_answer') {
                  set((state) => ({
                    answerChunks: [...state.answerChunks, data.content]
                  }))
                } else if (eventType === 'workflow') {
                  set({ workflow: data })
                } else if (eventType === 'metrics') {
                  set({ metrics: data })
                }

              } catch (err) {
                console.error('❌ Error parsing SSE event:', err, 'Raw data:', dataStr)
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('❌ SSE stream error:', err)
    } finally {
      console.log('🏁 Stream ended')
      set({ isStreaming: false })
    }
  },

  reset: () =>
    set({
      prompt: null,
      workflow: null,
      logs: [],
      nodePositions: {},
      isLayoutLocked: false,
      answerChunks: [],
      isStreaming: false,
      metrics: null,
    }),
}))