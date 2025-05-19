'use client'

import { useEffect, useState, useRef } from 'react'
import Editor, { OnMount, Monaco } from '@monaco-editor/react'
import { useFileStore } from '@/state/fileStore'

interface FileContentEvent {
  type: string
  data: {
    path: string
    content: string
  }
}

export default function MonacoViewer({
  filePath,
  isWorkflowComplete,
}: {
  filePath: string
  isWorkflowComplete: boolean
}) {
  const [language, setLanguage] = useState<string>('plaintext')
  const editorRef = useRef<Monaco | null>(null)
  const { setFileContent, addEventSource, removeEventSource } = useFileStore()
  const backendUrl = 'http://localhost:8000'

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor
    console.log('[MonacoViewer] Editor mounted for:', filePath)
  }

  const handleEditorWillUnmount = () => {
    console.log('[MonacoViewer] Editor unmounted for:', filePath)
    editorRef.current = null
  }

  const updateEditorContent = (content: string) => {
    if (!editorRef.current) return
    const model = editorRef.current.getModel()
    if (!model) return

    const pos = editorRef.current.getPosition()
    const viewState = editorRef.current.saveViewState()
    model.setValue(content)
    if (pos) editorRef.current.setPosition(pos)
    if (viewState) editorRef.current.restoreViewState(viewState)
  }

  const loadFileViaREST = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/file-content?file=${encodeURIComponent(filePath)}`, {
        method: 'GET',
        credentials: 'include',
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      if (data.content) {
        setFileContent(filePath, data.content, null)
        updateEditorContent(data.content)
      }
    } catch (error) {
      console.error('[MonacoViewer] REST load error:', error)
      setFileContent(filePath, null, 'Failed to load content')
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    let es: EventSource | null = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    const reconnectDelay = 1000
    let refreshInterval: NodeJS.Timeout | null = null
    let denied = false

    const connectSSE = () => {
      if (denied) return
      if (es) es.close()

      es = new EventSource(`${backendUrl}/api/files/events`, {
        withCredentials: true
      })

      es.addEventListener('file_content_diff', (event) => {
        try {
          const data: FileContentEvent = JSON.parse(event.data)
          if (data.data.path === filePath) {
            setFileContent(filePath, data.data.content, null)
            updateEditorContent(data.data.content)
          }
        } catch (err) {
          console.error('[MonacoViewer] SSE diff error:', err)
        }
      })

      es.addEventListener('closed', () => {
        console.log('[MonacoViewer] SSE closed by server (workflow inactive)')
        denied = true
        es?.close()
      })

      es.onopen = () => {
        reconnectAttempts = 0
        loadFileViaREST()
        refreshInterval = setInterval(() => {
          loadFileViaREST()
        }, 5000)
      }

      es.onerror = () => {
        if (denied) return
        if (reconnectAttempts++ < maxReconnectAttempts) {
          console.warn(`[MonacoViewer] Reconnecting SSE (${reconnectAttempts})`)
          setTimeout(connectSSE, reconnectDelay)
        } else {
          console.error('[MonacoViewer] Max SSE reconnects reached')
        }
      }

      addEventSource(filePath, es)
    }

    if (isWorkflowComplete) {
      console.log('[MonacoViewer] Workflow complete, using REST only')
      loadFileViaREST()
      return () => controller.abort()
    }

    connectSSE()

    return () => {
      if (es) {
        es.close()
        removeEventSource(filePath)
      }
      if (refreshInterval) clearInterval(refreshInterval)
      controller.abort()
    }
  }, [filePath, isWorkflowComplete])

  useEffect(() => {
    const ext = filePath.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      json: 'json',
      html: 'html',
      css: 'css',
      md: 'markdown',
      txt: 'plaintext',
    }
    setLanguage(languageMap[ext || ''] || 'plaintext')
  }, [filePath])

  const fileContent = useFileStore((state) => state.fileContents[filePath])
  const content = fileContent?.content ?? ''

  if (!fileContent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading file content...</div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <Editor
        height="100%"
        defaultLanguage={language}
        value={content}
        theme="vs-dark"
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on',
        }}
        onMount={handleEditorDidMount}
        beforeMount={handleEditorWillUnmount}
      />
    </div>
  )
}