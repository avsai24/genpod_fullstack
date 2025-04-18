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

export default function MonacoViewer({ filePath }: { filePath: string }) {
  const [language, setLanguage] = useState<string>('plaintext')
  const editorRef = useRef<Monaco | null>(null)
  const { setFileContent, addEventSource, removeEventSource } = useFileStore()

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor
    console.log('[MonacoViewer] Editor mounted for file:', filePath)
  }

  // Handle editor unmount
  const handleEditorWillUnmount = () => {
    console.log('[MonacoViewer] Editor unmounting for file:', filePath)
    editorRef.current = null
  }

  // Update Monaco editor content while preserving state
  const updateEditorContent = (content: string) => {
    if (!editorRef.current) return

    const model = editorRef.current.getModel()
    if (!model) return

    // Preserve cursor position and view state
    const position = editorRef.current.getPosition()
    const viewState = editorRef.current.saveViewState()

    // Update content
    model.setValue(content)

    // Restore cursor and view state
    if (position) {
      editorRef.current.setPosition(position)
    }
    if (viewState) {
      editorRef.current.restoreViewState(viewState)
    }
  }

  // Function to force refresh editor content
  const refreshEditorContent = async () => {
    try {
      const backendUrl = 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/file-content?file=${encodeURIComponent(filePath)}`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.content) {
        console.log('[MonacoViewer] Refreshed content for:', filePath)
        setFileContent(filePath, data.content, null)
        updateEditorContent(data.content)
      }
    } catch (error) {
      console.error('[MonacoViewer] Error refreshing content:', error)
    }
  }

  useEffect(() => {
    const backendUrl = 'http://localhost:8000'
    let es: EventSource | null = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    const reconnectDelay = 1000 // 1 second
    const refreshInterval = setInterval(() => {
      refreshEditorContent()
    }, 5000)

    const connect = () => {
      if (es) {
        es.close()
      }

      es = new EventSource(`${backendUrl}/api/files/events`, {
        withCredentials: true
      })

      // Handle file content updates
      es.addEventListener('file_content_diff', (event) => {
        try {
          const data: FileContentEvent = JSON.parse(event.data)
          if (data.data.path === filePath) {
            console.log('[MonacoViewer] Received content update for:', filePath)
            
            // Update Zustand store
            setFileContent(filePath, data.data.content, null)
            
            // Update Monaco editor
            updateEditorContent(data.data.content)
          }
        } catch (error) {
          console.error('[MonacoViewer] Error processing file_content_diff:', error)
        }
      })

      // Handle file tree updates
      es.addEventListener('file_tree', () => {
        console.log('[MonacoViewer] Received file tree update')
        // Force refresh when file tree updates
        refreshEditorContent()
      })

      es.onopen = () => {
        console.log('[MonacoViewer] SSE connection established for file:', filePath)
        reconnectAttempts = 0 // Reset reconnect attempts on successful connection
        
        // Request initial file content
        fetch(`${backendUrl}/api/file-content?file=${encodeURIComponent(filePath)}`, {
          method: 'GET',
          credentials: 'include',
        })
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`)
            }
            return res.json()
          })
          .then(data => {
            if (data.content) {
              console.log('[MonacoViewer] Received initial content for:', filePath)
              setFileContent(filePath, data.content, null)
              updateEditorContent(data.content)
            } else {
              console.error('[MonacoViewer] No content received for:', filePath)
              setFileContent(filePath, null, 'No content received')
            }
          })
          .catch(error => {
            console.error('[MonacoViewer] Error fetching initial content:', error)
            setFileContent(filePath, null, error.message)
          })
      }

      es.onerror = (error) => {
        console.error('[MonacoViewer] SSE connection error:', error)
        
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          console.log(`[MonacoViewer] Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`)
          setTimeout(connect, reconnectDelay)
        } else {
          console.error('[MonacoViewer] Max reconnection attempts reached')
          setFileContent(filePath, null, 'Connection lost')
        }
      }

      if (es) {
        addEventSource(filePath, es)
      }
    }

    // Initial connection
    connect()

    return () => {
      console.log('[MonacoViewer] Cleaning up SSE connection')
      if (es) {
        es.close()
        removeEventSource(filePath)
      }
      clearInterval(refreshInterval)
    }
  }, [filePath, setFileContent, addEventSource, removeEventSource])

  useEffect(() => {
    // Detect language based on file extension
    const extension = filePath.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'md': 'markdown',
      'txt': 'plaintext',
    }
    setLanguage(languageMap[extension || ''] || 'plaintext')
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