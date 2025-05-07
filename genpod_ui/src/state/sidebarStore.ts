// src/state/sidebarStore.ts
import { create } from 'zustand'

type ExpandableSection = 'projects' | 'profile' | 'tasks'

interface SidebarState {
  isHovered: boolean
  expandedItems: ExpandableSection[]
  keepExpanded: boolean
  setHovered: (val: boolean) => void
  setExpandedItem: (item: ExpandableSection) => void
  toggleExpandedItem: (item: ExpandableSection) => void
  resetExpandedItem: () => void
  setKeepExpanded: (val: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isHovered: false,
  expandedItems: [],
  keepExpanded: false,

  setHovered: (val) => set({ isHovered: val }),

  setExpandedItem: (item) =>
    set((state) => ({
      expandedItems: Array.from(new Set([...state.expandedItems, item])),
    })),

  toggleExpandedItem: (item) =>
    set((state) => {
      const isAlreadyExpanded = state.expandedItems.includes(item)
      return {
        expandedItems: isAlreadyExpanded
          ? state.expandedItems.filter((i) => i !== item)
          : [...state.expandedItems, item],
        keepExpanded: true,
      }
    }),

  resetExpandedItem: () => set({ expandedItems: [], keepExpanded: false }),

  setKeepExpanded: (val) => set({ keepExpanded: val }),
}))