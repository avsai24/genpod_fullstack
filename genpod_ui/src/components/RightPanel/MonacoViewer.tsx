'use client'

import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import path from 'path-browserify'

export default function MonacoViewer({ filePath }: { filePath: string }) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!filePath) return

    const es = new EventSource(
      `/api/files?path=${encodeURIComponent('/Users/venkatasaiancha/Documents/captenai/genpod_UI/genpod_ui')}`
    )

    const handleContent = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data)
        const normalizedPayloadPath = path.normalize(payload.path)
        const normalizedFilePath = path.normalize(filePath)

        console.log('[MonacoViewer] Comparing:', normalizedPayloadPath, 'vs', normalizedFilePath)

        if (normalizedPayloadPath === normalizedFilePath) {
          setContent(payload.content)
          setError(null)
        }
      } catch (err) {
        console.error('[MonacoViewer SSE] Failed to parse payload:', e.data)
      }
    }

    es.addEventListener('file_content', handleContent)

    es.onerror = (err) => {
      console.error('[MonacoViewer SSE] error:', err)
      setError('Failed to stream file content')
      es.close()
    }

    return () => {
      es.removeEventListener('file_content', handleContent)
      es.close()
    }
  }, [filePath])

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

  if (!content && !error) {
    return <div className="text-sm text-gray-400 p-4">Loading file...</div>
  }

  if (error) {
    return <div className="text-sm text-red-500 p-4">{error}</div>
  }

  return (
    <Editor
      height="100%"
      language={detectLanguage()}
      value={content ?? ''}
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