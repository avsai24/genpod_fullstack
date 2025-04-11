'use client'

import { useEffect, useState } from 'react'

export default function PreviewView({ projectPath }: { projectPath: string }) {
  const [htmlUrl, setHtmlUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPreview() {
      try {
       
        const res = await fetch(`/api/preview?path=${encodeURIComponent(projectPath)}`)
        const data = await res.json()

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to load index.html')
        }

        const blob = new Blob([data.content], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        setHtmlUrl(url)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Preview failed')
      }
    }

    fetchPreview()
  }, [projectPath])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-sm text-gray-500">
        <p className="text-2xl mb-2">🧐 No Preview Available</p>
        <p className="text-center max-w-xs">
          Genpod hasn’t generated an <code>index.html</code> yet.
          Once your app is created, a live preview will show up here.
        </p>
      </div>
    )
  }

  if (!htmlUrl) {
    return <div className="p-4 text-gray-400 text-sm">Loading preview...</div>
  }

  return (
    <div className="w-full h-full overflow-hidden bg-white border rounded">
      <iframe
        src={htmlUrl}
        className="w-full h-full border-0"
        title="Live Preview"
      />
    </div>
  )
}