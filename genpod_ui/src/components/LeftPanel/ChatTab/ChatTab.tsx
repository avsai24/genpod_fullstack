'use client'

import { useRef, useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/atom-one-dark.css'
import { Plus, Paperclip, Mic, Send } from 'lucide-react'
import { useAgentStreamStore } from '@/state/agentStreamStore'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { startLogStream } from '@/state/logStream'

export default function ChatTab() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { prompt, answer, isStreaming, startAgentStream, logs } = useAgentStreamStore()
  const [steps, setSteps] = useState<string[]>([])
  const { data: session } = useSession()


  console.log('🔄 ChatTab render:', {
    hasPrompt: !!prompt,
    hasAnswer: !!answer,
    isStreaming,
    inputLength: input.length
  })

  // Auto-scroll effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [prompt, answer, isStreaming, logs])

  // Parse steps from the first system log when streaming starts
  useEffect(() => {
    if (isStreaming && logs && logs.length > 0) {
      const systemLog = logs.find(log => 
        log.agent_name === 'System' && log.message.includes('"subtasks"')
      )
      
      if (systemLog) {
        try {
          const tasksMatch = systemLog.message.match(/\{"subtasks":\s*(\[.*?\])}/)
          if (tasksMatch) {
            const tasks = JSON.parse(tasksMatch[1])
            const parsedSteps = tasks.map((task: { agent: string; task: string }) => 
              `[${task.agent}] ${task.task}`
            )
            setSteps(parsedSteps)
          }
        } catch (err) {
          console.error('Failed to parse steps:', err)
        }
      }
    }
  }, [isStreaming, logs])

  
  const handleSend = () => {
    if (!input.trim() || !session?.user?.email) return

    const userPrompt = input.trim()
    const userEmail = session.user.email

    console.log('📤 Sending message:', userPrompt)

    // ✅ Start chat response streaming
    startAgentStream(userPrompt)

    // ✅ Start agent logs + events streaming
    startLogStream(userPrompt, userEmail)

    setInput('')
    setSteps([])
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
    <div className="flex flex-col h-full bg-surface">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {prompt && (
          <div className="flex justify-end">
            <div className="bg-input border border-border text-textPrimary rounded-lg px-4 py-2 max-w-[45%]">
              <p className="text-sm text-white font-medium whitespace-pre-wrap break-words">{prompt}</p>
            </div>
          </div>
        )}

        {/* Execution Plan and Logs */}
        {prompt && (steps.length > 0 || logs?.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-lg overflow-hidden"
          >
            {/* Steps Section */}
            {steps.length > 0 && (
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-medium text-textPrimary mb-3">Execution Plan:</h3>
                <AnimatePresence>
                  {steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-2 mb-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5" />
                      <p className="text-sm text-textSecondary">{step}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Logs Section */}
            <div className="bg-input p-4">
              {isStreaming ? (
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-3">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" />
                  </div>
                  <span>Genpod is thinking...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-accent mb-3">
                  <span>✓ Execution completed</span>
                </div>
              )}
              <AnimatePresence>
                {logs && logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="text-sm text-textSecondary mb-1 font-mono"
                  >
                    <span className="text-accent">[{log.agent_name}]</span>{' '}
                    {log.message}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {answer && (
          <div className="w-full text-textPrimary leading-relaxed px-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {answer}
            </ReactMarkdown>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion bubbles */}
      {!prompt && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {[
              "Create a blog generator app",
              "Build a REST API for book reviews",
              "Generate a React dashboard with charts",
              "Set up a Node.js + Express backend",
              "Build a landing page with Tailwind"
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  startAgentStream(suggestion)
                }}
                className="px-3 py-1.5 text-sm bg-input text-textSecondary border border-border rounded-full hover:bg-surface hover:text-textPrimary hover:border-textSecondary transition-colors duration-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="bg-surface p-3 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-lg border border-border bg-input px-4 py-3 shadow-sm w-full">
            <textarea
              rows={1}
              className="w-full bg-transparent text-sm text-textPrimary placeholder-textSecondary outline-none resize-none custom-scrollbar"
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
              <div className="flex items-center gap-4 text-textSecondary">
                <button className="hover:text-textPrimary hover:scale-110 active:scale-95 transition-all duration-150">
                  <Plus size={18} />
                </button>
                <label className="cursor-pointer hover:text-textPrimary hover:scale-110 active:scale-95 transition-all duration-150">
                  <Paperclip size={18} />
                  <input type="file" className="hidden" />
                </label>
                <button className="hover:text-textPrimary hover:scale-110 active:scale-95 transition-all duration-150">
                  <Mic size={18} />
                </button>
              </div>
              <button
                onClick={handleSend}
                className="rounded-full bg-white p-2 hover:bg-[#f3f4f6] active:bg-[#e5e7eb] active:scale-95 transform transition-all duration-150 text-[#1F2937] shadow-sm hover:shadow-md active:shadow"
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
          background-color: var(--border);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: var(--text-secondary);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }
        .custom-scrollbar:hover {
          scrollbar-color: var(--text-secondary) transparent;
        }
      `}</style>
    </div>
  )
}