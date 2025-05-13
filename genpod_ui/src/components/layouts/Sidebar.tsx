'use client'

import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  MessageSquare,
  FolderKanban,
  Settings,
  UserCircle2,
  LogOut,
  SlidersHorizontal,
  UserCog,
  Paperclip,
} from 'lucide-react'
import Image from 'next/image'
import { useChatStore } from '@/state/chatStore'
import { useSidebarStore } from '@/state/sidebarStore'

const projects = ['avsai', 'charan', 'chandu', 'viswas']

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

export default function Sidebar() {
  const router = useRouter()
  const { data: session } = useSession()
  const username = session?.user?.username || ''
  const initial = username.charAt(0).toUpperCase() || 'U'

  const setCurrentProject = useChatStore((s) => s.setCurrentProject)

  const isHovered = useSidebarStore((s) => s.isHovered)
  const setHovered = useSidebarStore((s) => s.setHovered)
  const expandedItems = useSidebarStore((s) => s.expandedItems)
  const toggleExpandedItem = useSidebarStore((s) => s.toggleExpandedItem)
  const resetExpandedItem = useSidebarStore((s) => s.resetExpandedItem)

  const isExpanded = (key: 'projects' | 'tasks' | 'profile') =>
    expandedItems.includes(key)

  return (
    <div
      className={`h-screen bg-[#000918] border-r border-[var(--border)] transition-all duration-300 overflow-hidden z-40 ${
        isHovered ? 'w-56' : 'w-16'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        if (!useSidebarStore.getState().keepExpanded) {
          resetExpandedItem()
        }
      }}
    >
      <div className="flex flex-col h-full py-4">
        {/* Logo */}
        <div className="mb-10 flex items-center justify-start w-full px-4">
          <Image
            src="/logo/Capten-Logo.svg"
            alt="Capten Logo"
            width={30}
            height={30}
            className="object-contain"
          />
          {isHovered && (
            <span className="ml-3 text-[var(--text-primary)] text-lg font-semibold">
              CAPTEN
            </span>
          )}
        </div>

        {/* Main Sections */}
        <SidebarIcon
          icon={<MessageSquare size={20} />}
          label="New Chat"
          isHovered={isHovered}
          onClick={() => router.push('/')}
        />

        <SidebarIcon
          icon={<FolderKanban size={20} />}
          label="Projects"
          isHovered={isHovered}
          onClick={() => toggleExpandedItem('projects')}
          active={isExpanded('projects')}
        />

        {isHovered && isExpanded('projects') && (
          <div className="ml-12 mt-1 space-y-1">
            {projects.map((proj) => (
              <div
                key={proj}
                onClick={() => {
                  setCurrentProject(proj)
                  router.push(`/projects/${proj}`)
                }}
                className="text-sm text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-secondary)]"
              >
                <span className="mr-2 text-[var(--accent-secondary)] text-xs">›</span>
                {proj}
              </div>
            ))}
          </div>
        )}

        <SidebarIcon
          icon={<Settings size={20} />}
          label="User Settings"
          isHovered={isHovered}
        />

        <SidebarIcon
          icon={<Paperclip size={20} />}
          label="Tasks"
          isHovered={isHovered}
          onClick={() => toggleExpandedItem('tasks')}
          active={isExpanded('tasks')}
        />

        {isHovered && isExpanded('tasks') && (
          <div className="ml-12 mt-1 space-y-1">
            <div
              onClick={() => router.push('/tasks/build-login-agent')}
              className="text-sm text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-secondary)]"
            >
              Build login agent
            </div>
            <div
              onClick={() => router.push('/tasks/setup-email-summarizer')}
              className="text-sm text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-secondary)]"
            >
              Setup email summarizer
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Profile Section Dropdown */}
        {isHovered && isExpanded('profile') && (
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
        )}

        {/* Profile Button */}
        <div
          className="flex items-center w-full px-4 mb-2 cursor-pointer hover:bg-[var(--surface-hover)] rounded transition-colors duration-200 py-3"
          onClick={() => toggleExpandedItem('profile')}
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
      </div>
    </div>
  )
}

function SidebarIcon({
  icon,
  label,
  isHovered,
  onClick,
  active,
}: {
  icon: React.ReactNode
  label: string
  isHovered: boolean
  onClick?: () => void
  active?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3 cursor-pointer transition-colors duration-200 ${
        active ? 'bg-[var(--surface-hover)]' : 'hover:bg-[var(--surface-hover)]'
      }`}
    >
      <span className="text-[var(--text-primary)]">{icon}</span>
      {isHovered && (
        <span className="ml-4 text-[var(--text-secondary)] text-sm whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  )
}