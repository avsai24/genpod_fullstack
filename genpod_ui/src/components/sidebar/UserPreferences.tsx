'use client'

import { signOut } from 'next-auth/react'
import {
  UserCircle2,
  UserCog,
  SlidersHorizontal,
  LogOut,
} from 'lucide-react'

interface UserPreferencesProps {
  isHovered: boolean
  isExpanded: boolean
}

const profileOptions = [
  { label: 'My Account', icon: <UserCircle2 size={16} /> },
  { label: 'Personalise', icon: <UserCog size={16} /> },
  { label: 'Settings', icon: <SlidersHorizontal size={16} /> },
  {
    label: 'Log Out',
    icon: <LogOut size={16} />,
    onClick: () => signOut({ callbackUrl: '/login' }),
  },
]

export default function UserPreferences({ isHovered, isExpanded }: UserPreferencesProps) {
  if (!isHovered || !isExpanded) return null

  return (
    <div className="ml-4 mb-2 p-2 rounded-lg shadow-lg bg-[var(--surface)] border border-[var(--border)] space-y-2 animate-fade-in w-48">
      {profileOptions.map((opt) => (
        <div
          key={opt.label}
          onClick={opt.onClick}
          className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] rounded hover:bg-[var(--surface-hover)] cursor-pointer transition"
        >
          <span className="text-[var(--text-secondary)]">{opt.icon}</span>
          <span>{opt.label}</span>
        </div>
      ))}
    </div>
  )
}