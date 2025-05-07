// src/state/sidebarStore.ts
// src/state/sidebarStore.ts
import { create } from 'zustand'

interface SidebarState {
  isHovered: boolean
  expandedItem: 'projects' | 'profile' | null
  keepExpanded: boolean
  setHovered: (val: boolean) => void
  toggleExpandedItem: (item: 'projects' | 'profile') => void
  resetExpandedItem: () => void
  setKeepExpanded: (val: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isHovered: false,
  expandedItem: null,
  keepExpanded: false,

  setHovered: (val) => set({ isHovered: val }),

  toggleExpandedItem: (item) =>
    set((state) => ({
      expandedItem: state.expandedItem === item ? null : item,
      keepExpanded: state.expandedItem === item ? false : true,
    })),

  resetExpandedItem: () => set({ expandedItem: null, keepExpanded: false }),

  setKeepExpanded: (val) => set({ keepExpanded: val }),
}))