import { create } from 'zustand'

type FileContent = {
  content: string | null
  error: string | null
  lastUpdated: number
}

type FileStore = {
  fileContents: Record<string, FileContent>
  eventSources: Record<string, EventSource>
  setFileContent: (filePath: string, content: string | null, error: string | null) => void
  addEventSource: (filePath: string, es: EventSource) => void
  removeEventSource: (filePath: string) => void
  cleanup: () => void
}

export const useFileStore = create<FileStore>((set, get) => ({
  fileContents: {},
  eventSources: {},
  
  setFileContent: (filePath, content, error) => {
    set((state) => ({
      fileContents: {
        ...state.fileContents,
        [filePath]: {
          content,
          error,
          lastUpdated: Date.now()
        }
      }
    }))
  },

  addEventSource: (filePath, es) => {
    // Close any existing connection for this file
    const { eventSources } = get()
    const existingEs = eventSources[filePath]
    if (existingEs) {
      console.log(`[FileStore] Closing existing SSE connection for ${filePath}`)
      existingEs.close()
    }

    set((state) => ({
      eventSources: {
        ...state.eventSources,
        [filePath]: es
      }
    }))
  },

  removeEventSource: (filePath) => {
    const { eventSources } = get()
    const es = eventSources[filePath]
    if (es) {
      console.log(`[FileStore] Removing SSE connection for ${filePath}`)
      es.close()
      set((state) => {
        const newEventSources = { ...state.eventSources }
        delete newEventSources[filePath]
        return { eventSources: newEventSources }
      })
    }
  },

  cleanup: () => {
    const { eventSources } = get()
    console.log('[FileStore] Cleaning up all SSE connections')
    Object.entries(eventSources).forEach(([filePath, es]) => {
      console.log(`[FileStore] Closing SSE connection for ${filePath}`)
      es.close()
    })
    set({ eventSources: {}, fileContents: {} })
  }
})) 