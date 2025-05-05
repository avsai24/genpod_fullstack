'use client'

import { useState } from 'react'
import { Gem, MessageSquare, FolderKanban, Settings } from 'lucide-react'

export default function Sidebar() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`h-screen border-r border-[var(--border)] flex flex-col py-4 bg-[#000918] transition-all duration-300 ${
        isHovered ? 'w-56' : 'w-16'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Section */}
      <div className="mb-6 flex items-center justify-start w-full px-4">
        <Gem size={24} className="text-white" />
        {isHovered && (
          <span className="ml-3 text-[var(--text-primary)] text-lg font-semibold">GENPOD</span>
        )}
      </div>

      {/* Icons */}
      <SidebarIcon icon={<MessageSquare size={20} />} label="Chat" isHovered={isHovered} />
      <SidebarIcon icon={<FolderKanban size={20} />} label="Projects" isHovered={isHovered} />
      <SidebarIcon icon={<Settings size={20} />} label="User Settings" isHovered={isHovered} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Profile Avatar */}
      <div className="flex items-center w-full px-4 mb-2 cursor-pointer hover:bg-[var(--surface-hover)] rounded transition-colors duration-200 py-3">
        <div className="w-8 h-8 rounded-full bg-[var(--accent-secondary)] text-white flex items-center justify-center text-xs font-bold">
          A
        </div>
        {isHovered && (
          <span className="ml-3 text-[var(--text-secondary)] text-sm">Profile</span>
        )}
      </div>
    </div>
  )
}

function SidebarIcon({
  icon,
  label,
  isHovered,
}: {
  icon: React.ReactNode
  label: string
  isHovered: boolean
}) {
  return (
    <div className="flex items-center w-full px-4 py-3 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors duration-200">
      <span className="text-[var(--text-primary)]">{icon}</span>
      {isHovered && (
        <span className="ml-4 text-[var(--text-secondary)] text-sm whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  )
}