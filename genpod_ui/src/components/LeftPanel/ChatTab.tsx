'use client'

import { useRef, useEffect, useState } from 'react'
import { useAgentStreamStore } from '@/state/agentStreamStore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/atom-one-dark.css'

import { Plus, Paperclip, Mic, Send } from 'lucide-react'

export default function ChatTab() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const { prompt, answer, isStreaming, startAgentStream } = useAgentStreamStore()

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100
      if (isAtBottom && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  const handleSend = () => {
    if (!input.trim()) return
    startAgentStream(input.trim(), 'testUser')
    setInput('')
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        <div className="w-full px-4 py-6 space-y-6">
          {/* User message */}
          {prompt && (
            <div className="flex justify-end mb-2">
              <div className="bg-blue-100 text-blue-800 rounded-lg px-4 py-2 max-w-[45%]">
                <p className="text-sm whitespace-pre-wrap break-words">{prompt}</p>
              </div>
            </div>
          )}

          {/* AI Response */}
          {answer && (
            <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-6 py-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {answer}
              </ReactMarkdown>
            </div>
          )}

          {/* Typing indicator */}
          {isStreaming && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              </div>
              <span>Genpod is responding...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white p-3 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-lg border bg-gray-50 px-4 py-3 shadow-sm w-full">
            <textarea
              rows={1}
              className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-500 outline-none resize-none custom-scrollbar"
              placeholder="Message Genpod..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              style={{ minHeight: '24px', maxHeight: '200px' }}
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4 text-gray-600">
                <button className="hover:text-blue-500 hover:scale-110 transition"><Plus size={18} /></button>
                <label className="cursor-pointer hover:text-blue-500 hover:scale-110 transition">
                  <Paperclip size={18} />
                  <input type="file" className="hidden" />
                </label>
                <button className="hover:text-blue-500 hover:scale-110 transition"><Mic size={18} /></button>
              </div>
              <button
                onClick={handleSend}
                className="rounded-full bg-blue-500 p-2 hover:bg-blue-600 transition text-white"
                title="Send"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #CBD5E0;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #A0AEC0;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E0 transparent;
        }
        .custom-scrollbar:hover {
          scrollbar-color: #A0AEC0 transparent;
        }
      `}</style>
    </div>
  )
}