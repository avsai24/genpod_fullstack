'use client'

import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  MessageSquare,
  FolderKanban,
  Settings,
  Paperclip,
} from 'lucide-react'
import Image from 'next/image'
import { useSidebarStore } from '@/state/sidebarStore'
import SidebarIcon from './SidebarIcon'
import ProjectList from './project/ProjectList'
import TasksList from './tasks/TasksList'
import ProfileMenu from './profile/ProfileMenu'
import { useState } from 'react'
import GlobalUsageModal from './global_usage_settings/GlobalUsageModal'

export default function Sidebar() {
  const router = useRouter()
  const { data: session } = useSession()
  const username = session?.user?.name || ''
  const initial = username.charAt(0).toUpperCase() || 'U'
  const userId = session?.user?.id

  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [showGlobalModal, setShowGlobalModal] = useState(false)

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
        // prevent sidebar collapse if creation popup is open
        if (!isCreatingProject) {
          setHovered(false)
          if (!useSidebarStore.getState().keepExpanded) {
            resetExpandedItem()
          }
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

        {/* New Chat */}
        <SidebarIcon
          icon={<MessageSquare size={20} />}
          label="New Chat"
          isHovered={isHovered}
          onClick={() => router.push('/')}
        />

        {/* Projects */}
        <SidebarIcon
          icon={<FolderKanban size={20} />}
          label="Projects"
          isHovered={isHovered}
          onClick={() => toggleExpandedItem('projects')}
          active={isExpanded('projects')}
          trailing={
            <button
            data-project-plus 
              onClick={(e) => {
                e.stopPropagation()
                setIsCreatingProject((prev) => !prev)
              }}
              className={`text-lg transition ${
                isExpanded('projects') && isHovered
                  ? 'text-[var(--text-primary)] hover:text-[var(--background)] opacity-100'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              +
            </button>
          }
        />

        {isHovered && isExpanded('projects') && (
          <ProjectList
            userId={userId}
            isHovered={isHovered}
            isExpanded={isExpanded('projects')}
            isCreating={isCreatingProject}
            setIsCreating={setIsCreatingProject}
          />
        )}
        {/* Global Usage Settings (simple link) */}
        <SidebarIcon
          icon={<Settings size={20} />}
          label="Global Usage Settings"
          isHovered={isHovered}
          onClick={() => setShowGlobalModal(true)}
        />

        {/* Tasks */}
        <SidebarIcon
          icon={<Paperclip size={20} />}
          label="Tasks"
          isHovered={isHovered}
          onClick={() => toggleExpandedItem('tasks')}
          active={isExpanded('tasks')}
        />
        <TasksList isHovered={isHovered} isExpanded={isExpanded('tasks')} />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Profile Section */}
        <ProfileMenu
          isHovered={isHovered}
          username={username}
          initial={initial}
          onClick={() => toggleExpandedItem('profile')}
          isExpanded={isExpanded('profile')}
          onSignOut={() => signOut({ callbackUrl: '/login' })}
        />
      </div>
            <GlobalUsageModal
        open={showGlobalModal}
        onClose={() => setShowGlobalModal(false)}
      />
    </div>
  )
}