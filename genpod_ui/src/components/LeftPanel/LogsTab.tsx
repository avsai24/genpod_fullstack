'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAgentStreamStore } from '@/state/agentStreamStore'

export default function LogsTab() {
  const logs = useAgentStreamStore((s) => s.logs)
  const prompt = useAgentStreamStore((s) => s.prompt)
  const scrollRef = useRef<HTMLUListElement>(null)

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [logs])

  return (
    <div className="w-full h-full flex flex-col bg-black text-white font-mono border border-gray-800 rounded overflow-hidden">
      <div className="p-3 border-b border-gray-700 text-sm font-semibold text-white bg-gray-900">
        Real-Time Agent Logs
      </div>

      {prompt ? (
        <ul
          ref={scrollRef}
          className="flex-1 overflow-y-auto text-xs bg-black px-3 py-2 space-y-1"
        >
          <AnimatePresence initial={false}>
            {logs.map((log, idx) => (
              <motion.li
                key={`${log.timestamp}-${idx}`}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-[90px_60px_1fr] gap-4 border-b border-gray-800 py-1"
              >
                <span className="text-gray-500">{log.timestamp}</span>
                <span className={
                  log.message.toLowerCase().includes('error') ? 'text-red-400 font-semibold'
                  : 'text-green-400 font-semibold'
                }>
                  [INFO]
                </span>
                <span className="text-gray-100">[{log.agent_name}] {log.message}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          No logs yet. Start a prompt in the Chat tab.
        </div>
      )}
    </div>
  )
}