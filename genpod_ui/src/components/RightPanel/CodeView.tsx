'use client'

import { useEffect } from 'react'
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

  // 🧠 Auto-set project path on prompt
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
        <div className="flex flex-1 h-full">
          {/* Left: File Tree */}
          <div className="w-1/4 border-r border-border bg-surface h-full overflow-auto">
            <FileTree
              projectPath={projectPath}
              onFileClick={addFile}
            />
          </div>

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
