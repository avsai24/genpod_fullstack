'use client'

import Split from 'react-split'
import React, { useEffect } from 'react'

export default function SplitLayout({
  left,
  right,
}: {
  left: React.ReactNode
  right: React.ReactNode
}) {
  useEffect(() => {
    // This is just to ensure global styles for gutter are present
    const style = document.createElement('style')
    style.innerHTML = `
  .custom-gutter {
    background-color: #2a2a2a;
    width: 0.5px;
    cursor: col-resize;
    transition: background-color 0.2s ease;
  }

  .custom-gutter:hover {
    background-color: #3a3a3a; /* subtle on hover */
  }
`
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <Split
      className="flex w-full h-screen"
      sizes={[50, 50]}
      minSize={200}
      gutterSize={1.5}
      direction="horizontal"
      gutter={() => {
        const gutter = document.createElement('div')
        gutter.className = 'custom-gutter'
        return gutter
      }}
    >
      <div className="h-full overflow-auto bg-gray-100 border-r">{left}</div>
      <div className="h-full overflow-auto bg-white">{right}</div>
    </Split>
  )
}