'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { MoreHorizontal } from 'lucide-react'
import { motion } from 'framer-motion'

interface TasksListProps {
  isHovered: boolean
  isExpanded: boolean
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL

export default function TasksList({ isHovered, isExpanded }: TasksListProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const [tasks, setTasks] = useState<
    { task_id: string; task_title: string; created_at?: string }[]
  >([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)

  // 1️⃣ Fetch tasks when sidebar is hovered & expanded
  useEffect(() => {
    if (!isHovered || !isExpanded || !session?.user?.id) {
      setTasks([])
      return
    }
    fetch(
      `${API_BASE}/api/tasks/list?user_id=${session.user.id}&project_name=__default`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setTasks(data.tasks)
      })
      .catch(console.error)
  }, [isHovered, isExpanded, session?.user?.id])

  // 2️⃣ Close menu on any document click (outside menu or toggle)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        openMenuId &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpenMenuId(null)
        setMenuPos(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenuId])

  // 3️⃣ Close menu when sidebar is no longer hovered
  useEffect(() => {
    if (!isHovered) {
      setOpenMenuId(null)
      setMenuPos(null)
    }
  }, [isHovered])

  // 4️⃣ API call to delete task
  const handleDeleteTask = async () => {
    if (!selectedTaskId) return
    try {
      const res = await fetch(`${API_BASE}/api/tasks/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: selectedTaskId }),
      })
      const data = await res.json()
      if (data.ok) {
        setTasks((prev) =>
          prev.filter((t) => t.task_id !== selectedTaskId)
        )
      }
    } catch (err) {
      console.error('❌ Failed to delete task:', err)
    } finally {
      setShowDeleteModal(false)
      setSelectedTaskId(null)
    }
  }

  if (!isHovered || !isExpanded) return null

  return (
    <>
      <div className="ml-6 mt-2 pr-2 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto relative">
        {tasks.length === 0 && (
          <div className="text-sm text-muted-foreground">No tasks yet.</div>
        )}

        {tasks.map((task) => (
          <div
            key={task.task_id}
            className="relative group bg-surface border border-border rounded-lg p-3 hover:bg-muted/60 transition shadow-sm"
          >
            <div
              onClick={() =>
                router.push(`/projects/__default/tasks/${task.task_id}`)
              }
              className="cursor-pointer"
            >
              <div className="text-[var(--text-primary)] font-medium text-sm truncate">
                {task.task_title}
              </div>
              <div className="flex items-center justify-between text-muted-foreground text-xs mt-1">
                <span className="truncate">{task.created_at}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  title="Task Options"
                  onClick={(e) => {
                    e.stopPropagation()
                    const rect = (
                      e.currentTarget as HTMLButtonElement
                    ).getBoundingClientRect()
                    setMenuPos({ x: rect.right + 8, y: rect.top })
                    setOpenMenuId((prev) =>
                      prev === task.task_id ? null : task.task_id
                    )
                  }}
                  className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-accent-primary"
                >
                  <MoreHorizontal size={14} />
                </motion.button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating delete menu */}
      {openMenuId && menuPos && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-[var(--surface)] border border-border rounded-md shadow-md"
          style={{ top: menuPos.y, left: menuPos.x, width: 140 }}
        >
          <button
            className="w-full text-left px-3 py-2 text-red-500 text-sm hover:bg-red-100"
            onClick={() => {
              setSelectedTaskId(openMenuId)
              setShowDeleteModal(true)
              setOpenMenuId(null)
            }}
          >
            Delete Task
          </button>
        </div>
      )}

      {/* Confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-surface border border-border rounded-xl p-6 w-[300px] shadow-lg">
            <h2 className="text-md font-semibold text-[var(--text-primary)] mb-4">
              Delete this task?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-1 text-sm rounded border border-border text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}