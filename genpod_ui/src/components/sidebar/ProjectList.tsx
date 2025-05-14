'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useChatStore } from '@/state/chatStore'

interface Props {
  userId?: string
  isCreating: boolean
  setIsCreating: (v: boolean) => void
  isHovered: boolean
  isExpanded: boolean
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ProjectList({
  userId,
  isCreating,
  setIsCreating,
}: Props) {
  const router = useRouter()
  const setCurrentProject = useChatStore((s) => s.setCurrentProject)
  const [projects, setProjects] = useState<string[]>([])
  const [newProjectName, setNewProjectName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const pathname = usePathname()
  

  // Fetch projects
  useEffect(() => {
    if (!userId) return
    fetch(`${API_BASE}/api/projects/list?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setProjects(data.projects.map((p: any) => p.project_name))
        }
      })
      .catch(console.error)
  }, [userId])

  // Auto-focus input
  useEffect(() => {
    if (isCreating) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isCreating])

  // Close create box on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        cardRef.current &&
        !cardRef.current.contains(target) &&
        !target.closest('[data-project-plus]')
      ) {
        setIsCreating(false)
      }
    }
    if (isCreating) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCreating, setIsCreating])

  // Scroll active project into view
  useEffect(() => {
    const active = projects.find(
      (p) => pathname === `/projects/${encodeURIComponent(p)}`
    )
    if (active && itemRefs.current[active]) {
      itemRefs.current[active]?.scrollIntoView({ block: 'nearest' })
    }
  }, [pathname, projects])

  const handleCreate = async () => {
    const name = newProjectName.trim()
    if (!name) return
    try {
      const res = await fetch(`${API_BASE}/api/projects/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, project_name: name }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setCurrentProject(name)
      router.push(`/projects/${encodeURIComponent(name)}`)
    } catch (err) {
      console.error('❌ Project create error:', err)
    } finally {
      setNewProjectName('')
      setIsCreating(false)
    }
  }

  return (
    <div className="ml-12 mt-2 space-y-1 relative">
      {/* Scrollable list */}
      <div
        ref={scrollRef}
        className="max-h-31 overflow-y-auto pr-1 space-y-1"
      >
        {projects.map((proj) => {
          const isActive = pathname === `/projects/${encodeURIComponent(proj)}`
          return (
            <div
              ref={(el) => (itemRefs.current[proj] = el)}
              key={proj}
              onClick={() => {
                setCurrentProject(proj)
                router.push(`/projects/${encodeURIComponent(proj)}`)
              }}
              className={`flex items-center gap-2 px-2 py-1 text-sm rounded-md cursor-pointer
                transition-all duration-200 ease-in-out
                ${isActive
                  ? 'bg-[var(--surface-active)] text-[var(--accent-secondary)] font-semibold'
                  : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'}
              `}
            >
              <span className="text-[var(--accent-secondary)] text-xs">›</span>
              <span className="truncate">{proj}</span>
            </div>
          )
        })}
      </div>

      {/* Create project popup */}
      {isCreating && (
        <div
          ref={cardRef}
          className="fixed top-24 left-60 z-50 w-72 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg animate-fade-in"
        >
          <input
            ref={inputRef}
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value.slice(0, 40))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') setIsCreating(false)
            }}
            placeholder="Project Name"
            className="w-full mb-2 px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none"
          />
          <p className="text-xs text-[var(--text-secondary)] mb-2">
            Projects keep chats, files, and instructions organized.
          </p>
          <button
            onClick={handleCreate}
            disabled={!newProjectName.trim()}
            className={`w-full py-2 text-sm font-medium rounded transition ${
              newProjectName.trim()
                ? 'bg-[var(--accent-secondary)] text-white hover:opacity-90'
                : 'bg-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed'
            }`}
          >
            Create project
          </button>
        </div>
      )}
    </div>
  )
}