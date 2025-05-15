'use client'

import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/state/chatStore'
import Sidebar from '@/components/sidebar/Sidebar'
import {
  Paperclip,
  Mic,
  Send,
  MoreVertical,
  Settings,
  Pencil,
  Trash,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import { motion } from 'framer-motion'


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
  const [tasks, setTasks] = useState<any[]>([])
  const currentProject = useChatStore((s) => s.currentProject)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)


  useEffect(() => {
    setCurrentProject(project)
  }, [project])

  // Close the Project Settings menu on mousedown outside
  useEffect(() => {
    const handleProjectSettingsClickOutside = (e: MouseEvent) => {
      if (
        settingsContainerRef.current &&
        !settingsContainerRef.current.contains(e.target as Node)
      ) {
        setShowProjectSettings(false)
      }
    }
    document.addEventListener('mousedown', handleProjectSettingsClickOutside)
    return () =>
      document.removeEventListener('mousedown', handleProjectSettingsClickOutside)
  }, [])

  // Close the Task Options menu on click outside

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('.task-menu-container')
      if (!el) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return

    const fetchTasks = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/tasks/list?user_id=${session.user.id}&project_name=${decodeURIComponent(project)}`
        )
        const data = await res.json()
        console.log('📦 Tasks fetched:', data)  // 👈 Add this
        if (data.ok) {
          setTasks(data.tasks)
        }
      } catch (err) {
        console.error('❌ Failed to load tasks:', err)
      }
    }

    fetchTasks()
  }, [session?.user?.id, project])

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)

      // Remove task from local state
      setTasks((prev) => prev.filter((t) => t.task_id !== taskId))
      setOpenMenuId(null)
    } catch (err) {
      console.error('❌ Failed to delete task:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanedPrompt = prompt.trim()
    if (!cleanedPrompt || !session?.user?.id) return

    try {
      // Step 1: Save the task in DB
      await fetch(`${API_BASE}/api/tasks/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: session.user.id,
        project_name: decodeURIComponent(currentProject.trim()),
        task_prompt: cleanedPrompt,
      }),
    })

      // Step 2: Redirect
      router.push(`/workspace?prompt=${encodeURIComponent(cleanedPrompt)}`)
    } catch (err) {
      console.error('❌ Failed to create task:', err)
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
                onClick={() => setShowProjectSettings((prev) => !prev)}
                className="text-muted-foreground hover:text-accent-primary transition-transform duration-150 ease-in-out cursor-pointer hover:scale-105 active:rotate-12"
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
          <h3 className="text-base font-medium text-muted-foreground mb-3">Previous Tasks</h3>

          <div className="flex flex-col gap-3 pr-1">
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground">No tasks yet. Start with a prompt above.</p>
            )}

            {tasks.map((task) => (
              <div
                key={task.task_id}
                className="relative flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/70 transition cursor-pointer shadow-sm"
              >
                {/* ✅ Clickable area only for task content */}
                <div
                  className="flex items-start gap-3 w-full"
                  onClick={() => router.push(`/projects/${project}/tasks/${task.task_id}`)}
                >
                  <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-purple-500 text-white rounded-full font-semibold text-sm shrink-0">
                    {project?.trim()?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-base">{task.task_title}</div>
                    <div className="text-muted-foreground text-xs mt-1">{task.created_at}</div>
                  </div>
                </div>

                {/* ✅ Three-dot button with dropdown */}
                <div className="relative z-50 task-menu-container">
                  <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenMenuId((id) => (id === task.task_id ? null : task.task_id))
                  }}
                  className="p-1 hover:text-accent-primary text-muted-foreground cursor-pointer"
                  title="Task Options"
                >
                  <MoreVertical size={20} />
                </motion.button>

                    {openMenuId === task.task_id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-8 w-40 bg-[var(--surface)] border border-[var(--border)] rounded-md shadow-md p-2 z-[9999]"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTaskId(task.task_id)
                            setShowDeleteTaskModal(true)
                          }}
                          className="text-sm text-red-500 px-2 py-2 w-full text-left rounded hover:bg-red-500/10 transition"
                        >
                          Delete Task
                        </button>
                      </div>
                    )}
                  </div>
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

      <ConfirmDeleteModal
        isOpen={showDeleteTaskModal}
        onClose={() => setShowDeleteTaskModal(false)}
        onConfirm={() => {
          if (selectedTaskId) {
            handleDeleteTask(selectedTaskId)
            setShowDeleteTaskModal(false)
          }
        }}
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete Task"
        cancelText="Cancel"
      />
    </div>
  )
}