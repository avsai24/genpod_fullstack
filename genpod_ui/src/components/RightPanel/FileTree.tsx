'use client'

import { useEffect, useState } from 'react'
import { Folder, FileText, ChevronDown, ChevronRight } from 'lucide-react'

export type FileNode = {
  type: 'file' | 'folder'
  name: string
  path: string
  children?: FileNode[]
}

export default function FileTree({
  projectPath,
  onFileClick,
}: {
  projectPath: string
  onFileClick?: (file: { name: string; path: string }) => void
}) {
  const [tree, setTree] = useState<FileNode[] | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const es = new EventSource(`/api/files?path=${encodeURIComponent(projectPath)}`)

    const handleFileTree = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data)
        setTree(payload)
      } catch (err) {
        console.error('[FileTree SSE] Invalid JSON payload:', e.data)
      }
    }

    es.addEventListener('file_tree', handleFileTree)

    es.onerror = (err: any) => {
      console.error('[FileTree SSE] error:', {
        message: err?.message,
        event: err,
        readyState: es.readyState,
      })
      es.close()
    }

    return () => {
      es.removeEventListener('file_tree', handleFileTree)
      es.close()
    }
  }, [projectPath])

  const toggle = (path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }))
  }

  const matchesSearch = (name: string) => {
    return name.toLowerCase().includes(searchTerm.toLowerCase())
  }

  const filterTree = (nodes: FileNode[]): FileNode[] => {
    return nodes
      .map((node) => {
        if (node.type === 'folder') {
          const filteredChildren = node.children ? filterTree(node.children) : []
          if (matchesSearch(node.name) || filteredChildren.length > 0) {
            return { ...node, children: filteredChildren }
          }
          return null
        } else {
          return matchesSearch(node.name) ? node : null
        }
      })
      .filter((n): n is FileNode => n !== null)
  }

  const renderNode = (node: FileNode, level = 0) => {
    const isFolder = node.type === 'folder'
    const isOpen = expanded[node.path]

    return (
      <div key={node.path} className={`pl-${level * 4} text-sm`}>
        <div
          className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5"
          onClick={() => {
            if (isFolder) {
              toggle(node.path)
            } else {
              onFileClick?.({ name: node.name, path: node.path })
            }
          }}
        >
          {isFolder ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <FileText size={14} />
          )}
          {isFolder && <Folder size={14} className="text-blue-500" />}
          <span>{node.name}</span>
        </div>
        {isFolder && isOpen && node.children?.map((child) => renderNode(child, level + 1))}
      </div>
    )
  }

  const filteredTree = tree ? filterTree(tree) : []

  return (
    <div className="p-2 text-gray-800 text-sm overflow-y-auto h-full">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search files..."
        className="w-full mb-2 px-2 py-1 border rounded text-sm bg-white shadow-sm"
      />

      {!tree ? (
        <div className="text-center text-gray-400">
          No project yet. Chat with Genpod to create a project.
        </div>
      ) : (
        filteredTree.map((node) => renderNode(node))
      )}
    </div>
  )
}