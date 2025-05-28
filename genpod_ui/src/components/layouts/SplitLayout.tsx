'use client'

import Split from 'react-split'
import React, { useEffect, useState } from 'react'

export default function SplitLayout({
  left,
  right,
}: {
  left: React.ReactNode
  right: React.ReactNode
}) {
  // 🧠 Persist and restore split sizes from localStorage
  const [sizes, setSizes] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('split-sizes')
      return saved ? JSON.parse(saved) : [30, 70]
    }
    return [30, 70]
  })

  // 💅 Gutter style setup
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      .custom-gutter {
        background-color: var(--border);
        width: 0.5px;
        cursor: col-resize;
        transition: background-color 0.2s ease;
      }

      .custom-gutter:hover {
        background-color: var(--primary);
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <Split
      className="flex w-full h-screen bg-background"
      sizes={sizes}
      minSize={[240, 400]} // ⛔ Prevent left panel from collapsing
      gutterSize={1.5}
      direction="horizontal"
      onDragEnd={(newSizes) => {
        setSizes(newSizes)
        localStorage.setItem('split-sizes', JSON.stringify(newSizes))
      }}
      gutter={() => {
        const gutter = document.createElement('div')
        gutter.className = 'custom-gutter'
        return gutter
      }}
    >
      <div className="h-full overflow-auto bg-surface border-r border-border">
        {left}
      </div>
      <div className="h-full overflow-auto bg-surface">
        {right}
      </div>
    </Split>
  )
}