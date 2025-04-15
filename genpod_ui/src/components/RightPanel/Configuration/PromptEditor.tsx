'use client'

import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { useSession } from 'next-auth/react'

export default function PromptEditor() {
  const { data: session } = useSession()
  const [yamlContent, setYamlContent] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'saved' | 'error'>('idle')

  const API_BASE = 'http://localhost:8000/api'

  // Load YAML from backend on mount
  useEffect(() => {
    if (!session?.user?.email) return

    setStatus('loading')

    fetch(`${API_BASE}/prompts?user_id=${session.user.email}`)
      .then(res => res.json())
      .then(data => {
        if (data.prompt) setYamlContent(data.prompt)
        setStatus('idle')
      })
      .catch(() => setStatus('error'))
  }, [session])

  const handleEditorChange = (value: string | undefined) => {
    setYamlContent(value || '')
    setIsDirty(true)
  }

  const handleSave = async () => {
    if (!session?.user?.email) return

    setStatus('loading')

    const res = await fetch(`${API_BASE}/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: session.user.email,
        prompt: yamlContent,
      }),
    })

    if (res.ok) {
      setStatus('saved')
      setIsDirty(false)
      setTimeout(() => setStatus('idle'), 2000)
    } else {
      setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Edit AI Prompt (YAML)</h2>

      <div className="border border-gray-300 rounded overflow-hidden shadow-sm">
        <Editor
          height="400px"
          defaultLanguage="yaml"
          theme="vs-dark"
          value={yamlContent}
          onChange={handleEditorChange}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            lineNumbers: 'on',
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={!isDirty || status === 'loading'}
          onClick={handleSave}
        >
          {status === 'loading' ? 'Saving...' : 'Save Prompt'}
        </button>

        {status === 'saved' && (
          <span className="text-green-600 text-sm">Saved</span>
        )}
        {status === 'error' && (
          <span className="text-red-500 text-sm">Error saving</span>
        )}
      </div>
    </div>
  )
}