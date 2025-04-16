'use client'

import { useEffect } from 'react'
import Editor from '@monaco-editor/react'
import path from 'path-browserify'
import { useFileStore } from '@/state/fileStore'

export default function MonacoViewer({ filePath }: { filePath: string }) {
  const { fileContents, setFileContent, addEventSource, removeEventSource } = useFileStore()
  const fileContent = fileContents[filePath]

  useEffect(() => {
    if (!filePath) return

    // Create a unique URL for each file
    const es = new EventSource(
      `/api/files?path=${encodeURIComponent('/Users/venkatasaiancha/Documents/captenai/genpod_UI/genpod_ui')}&file=${encodeURIComponent(filePath)}`
    )

    const handleContent = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data)
        const normalizedPayloadPath = path.normalize(payload.path)
        const normalizedFilePath = path.normalize(filePath)

        console.log('[MonacoViewer] Comparing:', normalizedPayloadPath, 'vs', normalizedFilePath)

        if (normalizedPayloadPath === normalizedFilePath) {
          setFileContent(filePath, payload.content, null)
        }
      } catch (err) {
        console.error('[MonacoViewer SSE] Failed to parse payload:', e.data)
        setFileContent(filePath, null, 'Failed to parse file content')
      }
    }

    es.addEventListener('file_content', handleContent)

    es.onerror = (error) => {
      console.error('[MonacoViewer SSE] error:', error)
      setFileContent(filePath, null, 'Failed to stream file content')
      es.close()
    }

    // Add a connection state listener
    es.onopen = () => {
      console.log(`[MonacoViewer] SSE connection opened for ${filePath}`)
    }

    addEventSource(filePath, es)

    return () => {
      console.log(`[MonacoViewer] Cleaning up SSE connection for ${filePath}`)
      es.removeEventListener('file_content', handleContent)
      removeEventSource(filePath)
    }
  }, [filePath, setFileContent, addEventSource, removeEventSource])

  const detectLanguage = () => {
    const ext = path.extname(filePath).toLowerCase()
    if (ext === '.ts' || ext === '.tsx') return 'typescript'
    if (ext === '.js' || ext === '.jsx') return 'javascript'
    if (ext === '.py') return 'python'
    if (ext === '.json') return 'json'
    if (ext === '.html') return 'html'
    if (ext === '.css') return 'css'
    if (ext === '.java') return 'java'
    if (ext === '.md') return 'markdown'
    return 'plaintext'
  }

  if (!fileContent) {
    return <div className="text-sm text-gray-400 p-4">Loading file...</div>
  }

  if (fileContent.error) {
    return <div className="text-sm text-red-500 p-4">{fileContent.error}</div>
  }

  return (
    <Editor
      height="100%"
      language={detectLanguage()}
      value={fileContent.content ?? ''}
      theme="vs-dark"
      options={{
        readOnly: true,
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        roundedSelection: true,
        lineNumbers: 'on',
        wordWrap: 'on',
        padding: { top: 12, bottom: 12 },
        scrollbar: {
          vertical: 'hidden',
          horizontal: 'hidden',
        },
      }}
      className="rounded-b-xl overflow-hidden"
    />
  )
}