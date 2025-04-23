'use client'

import { useState, useEffect } from 'react'
import FileTree from './FileTree'
import FileTabs, { OpenFile } from './FileTabs'
import MonacoViewer from './MonacoViewer'
import { useFileStore } from '@/state/fileStore'

export default function CodeView() {
  const [projectPath, setProjectPath] = useState<string | null>(null)
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
  const [activePath, setActivePath] = useState<string | null>(null)
  const { cleanup } = useFileStore()

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  const handleFileClick = (file: OpenFile) => {
    setOpenFiles((prev) => {
      const exists = prev.find((f) => f.path === file.path)
      if (exists) return prev
      return [...prev, file]
    })
    setActivePath(file.path)
  }

  const handleClose = (path: string) => {
    setOpenFiles((prev) => {
      const index = prev.findIndex((f) => f.path === path)
      const newFiles = prev.filter((f) => f.path !== path)
  
      
      if (path === activePath) {
        const next = newFiles[index] || newFiles[index - 1] || null
        setActivePath(next?.path || null)
      }
  
      return newFiles
    })
  }

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

          <button
            onClick={() =>
              setProjectPath('/Users/venkatasaiancha/Documents/captenai/genpod_UI/genpod_ui')
            }
            className="mt-6 px-4 py-2 bg-surface text-textPrimary border border-border rounded hover:bg-input transition-colors duration-200"
          >
            Simulate Project Start
          </button>
        </div>
      )}

      {/* Active project UI */}
      {projectPath && (
        <div className="flex flex-1 h-full">
          {/* Left: File Tree */}
          <div className="w-1/4 border-r border-border bg-surface h-full overflow-auto">
            <FileTree
              projectPath={projectPath}
              onFileClick={(file) => handleFileClick(file)}
            />
          </div>

          {/* Right: Tabs + Editor area */}
          <div className="flex-1 flex flex-col bg-background">
            <FileTabs
              openFiles={openFiles}
              activePath={activePath}
              onSelect={(path) => setActivePath(path)}
              onClose={(path) => handleClose(path)}
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
