// components/sidebar/SidebarIcon.tsx
'use client'

import { ReactNode } from 'react'

interface SidebarIconProps {
  icon: ReactNode
  label: string
  isHovered: boolean
  onClick?: () => void
  active?: boolean
  trailing?: ReactNode 
}

export default function SidebarIcon({
  icon,
  label,
  isHovered,
  onClick,
  active,
  trailing,
}: SidebarIconProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between w-full px-4 py-3 cursor-pointer transition-colors duration-200 ${
        active ? 'bg-[var(--surface-hover)]' : 'hover:bg-[var(--surface-hover)]'
      }`}
    >
      <div className="flex items-center gap-3 text-[var(--text-primary)]">
        {icon}
        {isHovered && (
          <span className="text-sm text-[var(--text-primary)] whitespace-nowrap">
            {label}
          </span>
        )}
      </div>

      {isHovered && trailing && <div>{trailing}</div>}
    </div>
  )
}