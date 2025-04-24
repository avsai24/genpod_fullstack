'use client'

import React, { useRef } from 'react'
import Draggable from 'react-draggable'

export default function LogPanel({
  title,
  content,
  onClose
}: {
  title: string
  content: string[]
  onClose: () => void
}) {
  const nodeRef = useRef(null) // ✅ use ref to avoid findDOMNode

  return (
    <Draggable nodeRef={nodeRef}>
      <div
        ref={nodeRef} // ✅ attach ref here
        className="absolute top-32 left-1/2 -translate-x-1/2 z-50 w-[480px] bg-[#1a1a1a] border border-zinc-700 rounded-xl shadow-xl p-4 text-white cursor-move"
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto text-sm space-y-1 text-zinc-300">
          {content.length ? (
            content.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))
          ) : (
            <p className="italic text-zinc-600">No logs found.</p>
          )}
        </div>
      </div>
    </Draggable>
  )
}