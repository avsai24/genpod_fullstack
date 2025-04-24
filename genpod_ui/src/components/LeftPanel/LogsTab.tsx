'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAgentStreamStore } from '@/state/agentStreamStore'

export default function LogsTab() {
  const logs = useAgentStreamStore((s) => s.logs)
  const prompt = useAgentStreamStore((s) => s.prompt)
  const scrollRef = useRef<HTMLUListElement>(null)

  console.log('🔄 LogsTab render:', {
    logsCount: logs.length,
    hasPrompt: !!prompt,
    latestLog: logs[logs.length - 1]
  })

  useEffect(() => {
    console.log('📝 Logs updated:', {
      count: logs.length,
      latest: logs[logs.length - 1]
    })
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [logs])

  return (
    <div className="w-full h-full flex flex-col bg-background text-textPrimary border border-border rounded overflow-hidden">
      {prompt ? (
        <ul
          ref={scrollRef}
          className="flex-1 overflow-y-auto text-xs bg-background px-3 py-2 space-y-1"
        >
          <AnimatePresence initial={false}>
            {logs.map((log, idx) => (
              <motion.li
                key={`${log.timestamp || idx}-${idx}`}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-[90px_60px_1fr] gap-4 border-b border-border py-1"
              >
                <span className="text-textSecondary">{log.timestamp || ''}</span>
                <span
                  className={
                    log?.message?.toLowerCase().includes('error')
                      ? 'text-error font-semibold'
                      : 'text-success font-semibold'
                  }
                >
                  [INFO]
                </span>
                <span className="text-textPrimary">
                  [{log.agent_name || 'System'}] {log.message}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-textSecondary">
          No logs yet. Start a prompt in the Chat tab.
        </div>
      )}
    </div>
  )
}