'use client'

import { useRef, useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/atom-one-dark.css'
import { Plus, Paperclip, Mic, Send } from 'lucide-react'
import { useAgentStreamStore } from '@/state/agentStreamStore'

export default function ChatTab() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { prompt, answer, isStreaming, startAgentStream } = useAgentStreamStore()

  console.log('🔄 ChatTab render:', {
    hasPrompt: !!prompt,
    hasAnswer: !!answer,
    isStreaming,
    inputLength: input.length
  })

  const handleSend = () => {
    if (!input.trim()) return
    console.log('📤 Sending message:', input.trim())
    startAgentStream(input.trim(), 'user')
    setInput('')
  }

  useEffect(() => {
    console.log('📝 Chat state updated:', {
      prompt,
      answerLength: answer?.length,
      isStreaming
    })
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [prompt, answer, isStreaming])

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {prompt && (
          <div className="flex justify-end">
            <div className="bg-blue-100 text-blue-800 rounded-lg px-4 py-2 max-w-[45%]">
              <p className="text-sm whitespace-pre-wrap break-words">{prompt}</p>
            </div>
          </div>
        )}

        {answer && (
          <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-6 py-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {answer}
            </ReactMarkdown>
          </div>
        )}

        {isStreaming && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex space-x-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            </div>
            <span>Genpod is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
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