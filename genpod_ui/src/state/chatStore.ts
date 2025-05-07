import { create } from 'zustand'

export interface Task {
  id: string
  prompt: string
  timestamp: string
}

interface ChatStore {
  currentProject: string | null
  setCurrentProject: (name: string) => void

  taskHistory: Record<string, Task[]>
  addTask: (project: string, task: Task) => void
  getTasks: (project: string) => Task[]
}

export const useChatStore = create<ChatStore>((set, get) => ({
  currentProject: null,
  setCurrentProject: (name) => set({ currentProject: name }),

  taskHistory: {},

  addTask: (project, task) =>
    set((state) => ({
      taskHistory: {
        ...state.taskHistory,
        [project]: [task, ...(state.taskHistory[project] || [])]
      }
    })),

  getTasks: (project) => get().taskHistory[project] || []
}))