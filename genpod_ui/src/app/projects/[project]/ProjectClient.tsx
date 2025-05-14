'use client'

import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/state/chatStore'
import Sidebar from '@/components/sidebar/Sidebar'
import {
  Paperclip,
  Mic,
  Send,
  ChevronRight,
  Settings,
  Pencil,
  Trash,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
import ConfirmDeleteModal from './ConfirmDeleteModal'

export default function ProjectClient({ project }: { project: string }) {
  const setCurrentProject = useChatStore((s) => s.setCurrentProject)
  const [prompt, setPrompt] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(decodeURIComponent(project))
  const { data: session } = useSession()
  const [showProjectSettings, setShowProjectSettings] = useState(false)
  const settingsContainerRef = useRef<HTMLDivElement>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  

  useEffect(() => {
    setCurrentProject(project)
  }, [project])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        settingsContainerRef.current &&
        !settingsContainerRef.current.contains(e.target as Node)
      ) {
        setShowProjectSettings(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    console.log('Submit prompt:', prompt)
    setPrompt('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleSaveEdit = async () => {
  const newName = editedName.trim()
  if (!newName || newName === project) {
    setIsEditing(false)
    return
  }

  try {
    const res = await fetch(`${API_BASE}/api/projects/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: session?.user?.id,
        old_name: decodeURIComponent(project),
        new_name: newName,
      }),
    })

    const data = await res.json()
    if (!data.ok) throw new Error(data.message)

    setCurrentProject(newName)
    setIsEditing(false)
    router.push(`/projects/${encodeURIComponent(newName)}`)
  } catch (err) {
    console.error('❌ Rename project failed:', err)
  }
}

  const handleDelete = async () => {
try {
    const res = await fetch(`${API_BASE}/api/projects/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: session?.user?.id,
        project_name: decodeURIComponent(project),
      }),
    })

    const data = await res.json()
    if (!data.ok) throw new Error(data.message)

    router.push('/') // redirect to homepage after deletion
  } catch (err) {
    console.error('❌ Project delete error:', err)
  }
}
  
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar (fixed) */}
      <div className="w-16 relative overflow-visible shrink-0">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-8 py-10 overflow-y-auto">
        <div className="flex flex-col items-start mt-24 w-full max-w-2xl mx-auto">
          {/* Project Header */}
          <div className="w-full flex items-center justify-between mb-4 relative">
            {isEditing ? (
              <div className="flex items-center gap-2 w-full max-w-[80%]">
                <input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-xl font-medium text-muted-foreground bg-transparent border border-border rounded px-2 py-1 w-full focus:outline-none"
                />
                <button
                  onClick={handleSaveEdit}
                  className="text-sm text-white bg-[var(--accent-secondary)] px-3 py-1 rounded hover:opacity-90 transition"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-sm text-muted-foreground hover:text-red-500 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h2 className="text-xl font-medium text-muted-foreground truncate max-w-[80%]">
                {decodeURIComponent(project)}
              </h2>
            )}

            <div ref={settingsContainerRef} className="relative">
              <button
                title="Project Settings"
                className="text-muted-foreground hover:text-accent-primary transition"
                onClick={() => setShowProjectSettings((prev) => !prev)}
              >
                <Settings size={20} />
              </button>

              {showProjectSettings && (
                <div className="absolute right-0 top-8 w-60 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-md p-3 z-50">
                  <button
                  onClick={() => {
                    setIsEditing(true)
                    setEditedName(decodeURIComponent(project))
                    setShowProjectSettings(false)
                  }}
                  className="flex items-center gap-2 w-full text-sm text-muted-foreground px-2 py-2 rounded hover:bg-[var(--surface-hover)]"
                >
                  <Pencil size={16} />
                  Edit Project Name
                </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 w-full text-sm text-red-500 px-2 py-2 rounded hover:bg-red-500/10"
                  >
                    <Trash size={16} />
                    Delete Project
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Prompt Input */}
          <form
            onSubmit={handleSubmit}
            className="w-full bg-surface border border-border rounded-2xl px-6 py-4 flex items-end shadow-md mb-8"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value)
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto'
                  textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="Enter your requirements here..."
              className="flex-1 resize-none max-h-40 overflow-y-auto bg-transparent text-lg text-text-primary placeholder-text-secondary focus:outline-none"
            />
            <div className="flex items-center space-x-4 ml-4 pb-1">
              <button
                type="button"
                className="text-text-secondary hover:text-accent-primary"
                title="Attach file"
              >
                <Paperclip size={20} />
              </button>
              <button
                type="button"
                className="text-text-secondary hover:text-accent-primary"
                title="Use voice"
              >
                <Mic size={20} />
              </button>
              <button
                type="submit"
                className="text-accent-primary hover:text-accent-hover transition"
                title="Send"
              >
                <Send size={22} />
              </button>
            </div>
          </form>
        </div>

        {/* Previous Tasks */}
        <div className="w-full max-w-2xl mx-auto">
          <h3 className="text-base font-medium text-muted-foreground mb-3">
            Previous Tasks
          </h3>
          <div className="flex flex-col gap-3">
            {[{ id: 'task2', title: 'task 2', time: '2 hours ago' }, { id: 'task1', title: 'task 1', time: 'May 1, 2025' }].map((task) => (
              <div
                key={task.id}
                onClick={() =>
                  router.push(`/projects/${project}/tasks/${task.id}`)
                }
                className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/70 transition cursor-pointer shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-purple-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold">
                    {project?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-base">{task.title}</div>
                    <div className="text-muted-foreground text-xs mt-1">
                      {task.time}
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          handleDelete()
          setShowDeleteModal(false)
        }}
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete Project"
        cancelText="Cancel"
      />
    </div>
  )
}