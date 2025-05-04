'use client'

import { useEffect, useState } from 'react'
import { Gem, MessageSquare, FolderKanban, Settings } from 'lucide-react'

const projects = ['avsai', 'charan', 'chandu', 'viswas']

export default function Sidebar() {
  const [isHovered, setIsHovered] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div
      className="relative flex h-screen"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Sidebar */}
      <div className="w-16 bg-[#000918] border-r border-[var(--border)] flex flex-col items-center py-4">
        {/* Logo */}
        <div className="mb-6">
          <Gem size={24} className="text-white" />
        </div>

        {/* Sidebar Icons */}
        <SidebarIcon icon={<MessageSquare size={20} />} label="new chat" />
        <SidebarIcon
          icon={<FolderKanban size={20} />}
          label="projects"
          active={isHovered}
        />
        <SidebarIcon icon={<Settings size={20} />} label="preferences" />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Avatar */}
        <div className="mb-2 w-8 h-8 rounded-full bg-[var(--accent-secondary)] text-white flex items-center justify-center text-xs font-bold">
          A
        </div>
      </div>

      {/* Projects drawer */}
      {isMounted && isHovered && (
        <div className="w-48 h-full bg-[var(--surface)] border-r border-[var(--border)] shadow-lg z-10 transition-all duration-200">
          <div className="p-3 text-xs font-semibold text-[var(--text-secondary)] uppercase border-b border-[var(--border)]">
            My Projects
          </div>
          <ul className="p-2 space-y-1">
            {projects.map((proj) => (
              <li
                key={proj}
                className="px-3 py-1 rounded hover:bg-[var(--surface-hover)] cursor-pointer text-sm text-[var(--text-primary)]"
              >
                {proj}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SidebarIcon({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
}) {
  return (
    <div
      title={label}
      className={`flex flex-col items-center py-4 space-y-1 w-full cursor-pointer ${
        active ? 'bg-[var(--accent-secondary)] text-white' : 'hover:bg-[var(--surface-hover)]'
      }`}
    >
      <span className="text-[var(--text-primary)]">{icon}</span>
      <span className="text-[var(--text-secondary)] text-[10px]">{label}</span>
    </div>
  )
}