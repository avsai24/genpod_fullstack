'use client'

import { useEffect, useRef, useState } from 'react'
import FileTree from './FileTree'
import FileTabs from './FileTabs'
import MonacoViewer from './MonacoViewer'
import { useFileStore } from '@/state/fileStore'
import { useAgentStreamStore } from '@/state/agentStreamStore'
import { useProjectStore } from '@/state/projectStore'

export default function CodeView() {
  const prompt = useAgentStreamStore((s) => s.prompt)
  const { cleanup } = useFileStore()
  const {
    projectPath,
    openFiles,
    activePath,
    setProjectPath,
    addFile,
    closeFile,
    setActivePath,
  } = useProjectStore()

  const [sidebarWidth, setSidebarWidth] = useState(300) // Default sidebar width
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  useEffect(() => {
    if (prompt && !projectPath) {
      setProjectPath('/Users/venkatasaiancha/Documents/captenai/genpod_UI/genpod_ui')
    }
  }, [prompt, projectPath, setProjectPath])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  const startDragging = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = sidebarWidth
  }

  const stopDragging = () => {
    isDragging.current = false
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return
    const delta = e.clientX - startX.current
    const newWidth = startWidth.current + delta
    setSidebarWidth(Math.min(Math.max(newWidth, 180), 600)) // Clamp between 180px and 600px
  }

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', stopDragging)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', stopDragging)
    }
  }, [])

  return (
    <div className="h-full bg-background flex flex-col">
      {/* No project yet */}
      {!projectPath && (
        <div className="flex-1 flex flex-col items-center justify-center text-textSecondary text-sm px-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3"/>
            </svg>
            <p>No project workspace yet</p>
            <p>Start a chat with Genpod to create or open a project</p>
          </div>
        </div>
      )}

      {/* Active project UI */}
      {projectPath && (
        <div className="flex flex-1 h-full overflow-hidden">
          {/* Left: File Tree */}
          <div
            style={{
              width: `${sidebarWidth}px`,
              minWidth: '180px',
              maxWidth: '600px',
              transition: isDragging.current ? 'none' : 'width 0.2s ease-out',
            }}
            className="h-full border-r border-border bg-surface overflow-auto"
          >
            <FileTree
              projectPath={projectPath}
              onFileClick={addFile}
            />
          </div>

          {/* Divider */}
          <div
            onMouseDown={startDragging}
            className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors"
          />

          {/* Right: Tabs + Editor */}
          <div className="flex-1 flex flex-col bg-background">
            <FileTabs
              openFiles={openFiles}
              activePath={activePath}
              onSelect={setActivePath}
              onClose={closeFile}
            />
            <div className="flex-1">
              {activePath ? (
                <MonacoViewer filePath={activePath} />
              ) : (
                <div className="text-textSecondary h-full flex items-center justify-center text-sm">
                  Select a file to view content
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}