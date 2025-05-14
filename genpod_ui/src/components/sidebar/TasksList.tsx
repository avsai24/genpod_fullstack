'use client'

import { useRouter } from 'next/navigation'
import React from 'react'

interface TasksListProps {
  isHovered: boolean
  isExpanded: boolean
}

const tasks = [
  { label: 'Build login agent', path: '/tasks/build-login-agent' },
  { label: 'Setup email summarizer', path: '/tasks/setup-email-summarizer' },
]

export default function TasksList({ isHovered, isExpanded }: TasksListProps) {
  const router = useRouter()

  if (!isHovered || !isExpanded) return null

  return (
    <div className="ml-12 mt-1 space-y-1">
      {tasks.map((task) => (
        <div
          key={task.label}
          onClick={() => router.push(task.path)}
          className="text-sm text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-secondary)] transition-colors"
        >
          {task.label}
        </div>
      ))}
    </div>
  )
}