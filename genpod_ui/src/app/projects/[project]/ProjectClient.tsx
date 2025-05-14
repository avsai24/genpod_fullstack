'use client'

import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/state/chatStore'
import Sidebar from '@/components/sidebar/Sidebar'
import { Paperclip, Mic, Send, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProjectClient({ project }: { project: string }) {
  const setCurrentProject = useChatStore((s) => s.setCurrentProject)
  const [prompt, setPrompt] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    setCurrentProject(project)
  }, [project])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    console.log('Submit prompt:', prompt)
    setPrompt('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
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
          {/* Project Name */}
          <h2 className="text-xl font-medium text-muted-foreground mb-4 self-start">
            {decodeURIComponent(project)}
          </h2>

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
              <button type="button" className="text-text-secondary hover:text-accent-primary" title="Attach file">
                <Paperclip size={20} />
              </button>
              <button type="button" className="text-text-secondary hover:text-accent-primary" title="Use voice">
                <Mic size={20} />
              </button>
              <button type="submit" className="text-accent-primary hover:text-accent-hover transition" title="Send">
                <Send size={22} />
              </button>
            </div>
          </form>
        </div>

        {/* Previous Tasks */}
        <div className="w-full max-w-2xl mx-auto">
          <h3 className="text-base font-medium text-muted-foreground mb-3">Previous Tasks</h3>
          <div className="flex flex-col gap-3">
            {[{ id: 'task2', title: 'task 2', time: '2 hours ago' }, { id: 'task1', title: 'task 1', time: 'May 1, 2025' }].map((task) => (
              <div
                key={task.id}
                onClick={() => router.push(`/projects/${project}/tasks/${task.id}`)}
                className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/70 transition cursor-pointer shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-purple-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold">
                    {project?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-base">{task.title}</div>
                    <div className="text-muted-foreground text-xs mt-1">{task.time}</div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}