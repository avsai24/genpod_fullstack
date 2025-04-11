'use client'

import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import path from 'path-browserify'

export default function MonacoViewer({ filePath }: { filePath: string }) {
    console.log('Monaco is rendering file:', filePath)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`)
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setContent(json.content)
      } catch (err: any) {
        console.error('Monaco load error:', err)
        setError(err.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
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

  if (loading) return <div className="text-sm text-gray-400 p-4">Loading file...</div>
  if (error) return <div className="text-sm text-red-500 p-4">{error}</div>

  return (
    <Editor
  height="100%"
  language={detectLanguage()}
  value={content}
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