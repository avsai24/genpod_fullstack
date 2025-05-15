'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { Mic, Paperclip, Send } from 'lucide-react'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'


export default function PromptView() {
  const [prompt, setPrompt] = useState('')
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { data: session, status } = useSession()

  useEffect(() => {
    console.log('🧪 PromptView session:', session, 'Status:', status)
  }, [session, status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || !session?.user?.id) return

    try {
      // 1. Save task in backend
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.id,
          project_name: 'default', // You can pass actual selected project if needed
          task_prompt: trimmedPrompt,
        }),
      })

      // 2. Redirect to workspace
      router.push(`/workspace?prompt=${encodeURIComponent(trimmedPrompt)}`)
    } catch (err) {
      console.error('❌ Failed to create task:', err)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center w-full max-w-3xl">
        {/* Logo above the input */}
        <div className="mb-6">
          <Image
            src="/logo/Capten_logo_full.svg"
            alt="Capten Logo"
            width={280}
            height={280}
            className="object-contain"
          />
        </div>

        {/* Prompt Input Box */}
        <form
          onSubmit={handleSubmit}
          className="w-full bg-surface border border-border rounded-2xl px-6 py-4 flex items-end shadow-md"
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
    </div>
  )
}