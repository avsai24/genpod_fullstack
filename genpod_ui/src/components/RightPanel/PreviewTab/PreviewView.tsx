'use client'

import { useEffect, useState } from 'react'
import { useAgentStreamStore } from '@/state/agentStreamStore'

interface PreviewError {
  message: string
  code?: string
}

export default function PreviewView() {
  const prompt = useAgentStreamStore((s) => s.prompt)
  const workflow = useAgentStreamStore((s) => s.workflow)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<PreviewError | null>(null)

  useEffect(() => {
    if (!workflow) return

    const fetchPreview = async () => {
      try {
        // Static path for now — you can make this dynamic later
        const projectPath = '/Users/venkatasaiancha/Documents/captenai/genpod_UI/genpod_ui'
        const encodedPath = encodeURIComponent(projectPath)

        const res = await fetch(`/api/preview?path=${encodedPath}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })

        const data = await res.json()

        if (!res.ok || !data.content) {
          throw new Error(data.error || 'Failed to load preview')
        }

        // Convert HTML content into a Blob URL
        const blob = new Blob([data.content], { type: 'text/html' })
        const blobUrl = URL.createObjectURL(blob)

        setPreviewUrl(blobUrl)
        setError(null)
      } catch (err) {
        console.error('Preview error:', err)
        setError({
          message: err instanceof Error ? err.message : 'An unknown error occurred',
          code: 'PREVIEW_ERROR',
        })
        setPreviewUrl(null)
      }
    }

    fetchPreview()
  }, [workflow])

  return (
    <div className="h-full flex flex-col bg-background text-textPrimary">
      {prompt && workflow ? (
        <div className="flex-1">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-sm text-textSecondary">
              <p className="text-error mb-2">Error loading preview:</p>
              <p>{error.message}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-textSecondary">
              Loading preview...
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-textSecondary">
          {prompt
            ? 'Preview will be displayed here once the workflow starts running.'
            : 'No workflow yet. Start with a prompt.'}
        </div>
      )}
    </div>
  )
}