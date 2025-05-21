'use client'

import {
  LogOut,
  UserCircle2,
  UserCog
} from 'lucide-react'
import { useState } from 'react'
import AccountModal from '../profile/AccountModal'
import PersonaliseModal from '../profile/PersonaliseModal'

interface ProfileMenuProps {
  isHovered: boolean
  isExpanded: boolean
  username: string
  initial: string
  onClick: () => void
  onSignOut: () => void
}

export default function ProfileMenu({
  isHovered,
  isExpanded,
  username,
  initial,
  onClick,
  onSignOut
}: ProfileMenuProps) {
  const [activeModal, setActiveModal] = useState<'account' | 'personalise' | null>(null)

  const profileOptions = [
    { label: 'My Account', icon: <UserCircle2 size={16} /> },
    { label: 'Personalise', icon: <UserCog size={16} /> },
    {
      label: 'Log Out',
      icon: <LogOut size={16} />,
      onClick: onSignOut
    }
  ]

  return (
    <>
      {/* Dropdown Panel */}
      {isHovered && isExpanded && (
        <div className="ml-4 mb-2 p-2 rounded-lg shadow-lg bg-[var(--surface)] border border-[var(--border)] space-y-2 animate-fade-in w-48">
          {profileOptions.map((opt) => {
            const handleClick = () => {
              if (opt.label === 'My Account') setActiveModal('account')
              else if (opt.label === 'Personalise') setActiveModal('personalise')
              else if (opt.onClick) opt.onClick()
            }

            return (
              <div
                key={opt.label}
                onClick={handleClick}
                className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] rounded hover:bg-[var(--surface-hover)] cursor-pointer transition"
              >
                <span className="text-[var(--text-secondary)]">{opt.icon}</span>
                <span>{opt.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Profile Trigger Row */}
      <div
        className="flex items-center w-full px-4 mb-2 cursor-pointer hover:bg-[var(--surface-hover)] rounded transition-colors duration-200 py-3"
        onClick={onClick}
      >
        <div className="w-8 h-8 rounded-full bg-[var(--accent-secondary)] text-white flex items-center justify-center text-xs font-bold">
          {initial}
        </div>
        {isHovered && (
          <span className="ml-3 text-[var(--text-secondary)] text-sm">
            {username || 'Profile'}
          </span>
        )}
      </div>

      {/* Modals */}
      
      {activeModal === 'account' && (
        <AccountModal open onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'personalise' && (
        <PersonaliseModal open onClose={() => setActiveModal(null)} />
      )}
    </>
  )
}