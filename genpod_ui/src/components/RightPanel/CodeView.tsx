'use client'

import { useState } from 'react'
import FileTree from './FileTree'
import FileTabs, { OpenFile } from './FileTabs'
import MonacoViewer from './MonacoViewer'

export default function CodeView() {
  const [projectPath, setProjectPath] = useState<string | null>(null)
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
  const [activePath, setActivePath] = useState<string | null>(null)

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
    <div className="h-full bg-white flex flex-col">
      {/* No project yet */}
      {!projectPath && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm px-6 text-center">
          <p>🧪 No project yet.</p>
          <p>Chat with Genpod to create a project.</p>

          <button
            onClick={() =>
              setProjectPath('/Users/venkatasaiancha/Documents/captenai/genpod_UI/genpod_ui')
            }
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
          >
            Simulate Genpod Project Start
          </button>
        </div>
      )}

      {/* Active project UI */}
      {projectPath && (
        <div className="flex flex-1 h-full">
          {/* Left: File Tree */}
          <div className="w-1/4 border-r bg-gray-50 h-full overflow-auto">
            <FileTree
              projectPath={projectPath}
              onFileClick={(file) => handleFileClick(file)}
            />
          </div>

          {/* Right: Tabs + Editor area */}
          <div className="flex-1 flex flex-col">
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
                <div className="text-gray-400 h-full flex items-center justify-center text-sm">
                  Select a file to view content.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
