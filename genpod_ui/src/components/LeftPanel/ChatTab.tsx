'use client'

import { useRef, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/atom-one-dark.css'

import { Plus, Paperclip, Mic, Send } from 'lucide-react'

interface Message {
  id: number
  sender: 'user' | 'genpod'
  text: string
}

export default function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentBotId, setCurrentBotId] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: input.trim(),
    }

    const botId = Date.now() + 1

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setCurrentBotId(botId)

    const eventSource = new EventSource(`/api/chat/stream?message=${encodeURIComponent(userMessage.text)}`)

    let botText = ''
    let isFirstChunk = true

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      botText += data.reply

      if (isFirstChunk) {
        setMessages((prev) => [...prev, { id: botId, sender: 'genpod', text: botText }])
        setIsLoading(false) // ✅ Spinner ends when first token arrives
        isFirstChunk = false
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botId ? { ...msg, text: botText } : msg
          )
        )
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      setIsLoading(false)
      setCurrentBotId(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl px-4 py-2 whitespace-pre-line break-words transition-all ${
              msg.sender === 'user'
                ? 'ml-auto bg-blue-100 text-blue-800 w-fit max-w-[70%] text-right'
                : 'mr-auto bg-gray-100 text-gray-800 w-full max-w-[100%]'
            }`}
          >
            {msg.sender === 'genpod' ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  p: ({ node, children }) => {
                    const hasCode = node.children?.some(
                      (child: any) => child.tagName === 'pre' || child.tagName === 'code'
                    )
                    return hasCode ? <>{children}</> : <p className="mb-2 text-sm">{children}</p>
                  },
                  code: ({ inline, children, ...props }) =>
                    inline ? (
                      <code className="bg-gray-200 px-1 rounded text-sm">{children}</code>
                    ) : (
                      <pre className="bg-gray-800 text-white p-3 rounded text-sm overflow-auto">
                        <code {...props}>{children}</code>
                      </pre>
                    ),
                  li: ({ children }) => <li className="ml-4 list-disc text-sm">{children}</li>,
                }}
              >
                {msg.text}
              </ReactMarkdown>
            ) : (
              msg.text
            )}
          </div>
        ))}

        {/* Typing indicator (spinner) */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:.1s]" />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:.2s]" />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:.3s]" />
            <span className="ml-2">Genpod is thinking...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white p-3 shadow-sm">
        <div className="rounded-2xl border bg-gray-50 px-4 py-3 shadow-sm w-full">
          <input
            type="text"
            className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-500 outline-none"
            placeholder="Message Genpod..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
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
  )
}