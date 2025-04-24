// src/state/projectStore.ts
import { create } from 'zustand'

export interface OpenFile {
  name: string
  path: string
}

interface ProjectStore {
  projectPath: string | null
  openFiles: OpenFile[]
  activePath: string | null
  setProjectPath: (path: string) => void
  addFile: (file: OpenFile) => void
  setActivePath: (path: string | null) => void
  closeFile: (path: string) => void
  reset: () => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projectPath: null,
  openFiles: [],
  activePath: null,

  setProjectPath: (path) => set({ projectPath: path }),

  addFile: (file) =>
    set((state) => {
      if (state.openFiles.find((f) => f.path === file.path)) return state
      return {
        openFiles: [...state.openFiles, file],
        activePath: file.path,
      }
    }),

  setActivePath: (path) => set({ activePath: path }),

  closeFile: (path) =>
    set((state) => {
      const filtered = state.openFiles.filter((f) => f.path !== path)
      const nextActive =
        path === state.activePath
          ? filtered.at(-1)?.path || null
          : state.activePath
      return { openFiles: filtered, activePath: nextActive }
    }),

  reset: () => set({ projectPath: null, openFiles: [], activePath: null }),
}))