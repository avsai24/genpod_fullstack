import { create } from 'zustand'
import type { LogEntry } from '@/types/logs'

type LogStore = {
  logs: LogEntry[]
  addLogs: (newLogs: LogEntry[]) => void
  clearLogs: () => void
}

export const useLogStore = create<LogStore>((set) => ({
  logs: [],
  addLogs: (newLogs) =>
    set((state) => ({
      logs: [...state.logs, ...newLogs].slice(-30), // Keep last 30 logs
    })),
  clearLogs: () => set({ logs: [] }),
}))