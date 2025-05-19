'use client'

import { useEffect, useState, useRef } from 'react'
import { Folder, FileText, ChevronDown, ChevronRight } from 'lucide-react'

interface FileTreeItem {
  name: string
  type: 'file' | 'directory'
  path: string
  size?: number
  modified?: number
  children?: FileTreeItem[]
}

export default function FileTree({
  onFileClick,
}: {
  onFileClick?: (file: { name: string; path: string }) => void
}) {
  const [tree, setTree] = useState<FileTreeItem[] | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const esRef = useRef<EventSource | null>(null)

  const backendUrl = 'http://localhost:8000'

  const handleFileTreeEvent = (event: MessageEvent) => {
    try {
      const rawData = event.data
      const parsedData = JSON.parse(rawData)
      const fileTreeArray = Array.isArray(parsedData) ? parsedData : [parsedData]

      const filteredTree = fileTreeArray
        .map((item) => {
          if (['node_modules', '.git', 'venv', '__pycache__', '.DS_Store'].includes(item.name)) return null
          if (item.children) {
            item.children = item.children.filter(
              (child: FileTreeItem) => !['node_modules', '.git', 'venv', '__pycache__', '.DS_Store'].includes(child.name)
            )
          }
          return item
        })
        .filter((item): item is FileTreeItem => item !== null)

      setTree(filteredTree)
      setConnectionStatus('connected')
    } catch (error) {
      console.error('[FileTree] Failed to parse SSE file_tree event:', error)
    }
  }

  const fetchTreeViaREST = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/files/tree`, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      console.log('[FileTree] REST response:', data)
      setTree(data)
      setConnectionStatus('connected')
    } catch (err) {
      console.error('[FileTree] REST fallback failed:', err)
      setConnectionStatus('disconnected')
    }
  }

  useEffect(() => {
    const es = new EventSource(`${backendUrl}/api/files/events`, { withCredentials: true })
    esRef.current = es

    es.onopen = () => {
      console.log('[FileTree] SSE connected')
      setConnectionStatus('connected')
    }

    es.addEventListener('file_tree', handleFileTreeEvent)

    es.addEventListener('closed', () => {
      console.log('[FileTree] SSE denied — switching to REST')
      es.close()
      fetchTreeViaREST()
    })

    es.onerror = (e) => {
      console.error('[FileTree] SSE error:', e)
      es.close()
      fetchTreeViaREST()
    }

    return () => {
      if (esRef.current) {
        esRef.current.close()
        esRef.current = null
      }
    }
  }, [])

  const toggle = (path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }))
  }

  const matchesSearch = (name: string) => name.toLowerCase().includes(searchTerm.toLowerCase())

  const filterTree = (nodes: FileTreeItem[]): FileTreeItem[] =>
    nodes
      .map((node) => {
        if (['node_modules', '.git', 'venv', '__pycache__', '.DS_Store'].includes(node.name)) return null
        if (node.type === 'directory') {
          const filteredChildren = node.children ? filterTree(node.children) : []
          if (filteredChildren.length > 0 || matchesSearch(node.name)) {
            return { ...node, children: filteredChildren }
          }
          return null
        }
        return matchesSearch(node.name) ? node : null
      })
      .filter((n): n is FileTreeItem => n !== null)

  const renderNode = (node: FileTreeItem, level = 0) => (
    <div key={node.path} style={{ paddingLeft: `${level * 16}px` }} className="text-sm">
      <div
        className={`flex items-center gap-2 px-2 py-1.5 hover:bg-input cursor-pointer group ${
          node.type === 'directory' ? 'text-textPrimary' : 'text-textSecondary'
        }`}
        onClick={() => {
          if (node.type === 'directory') {
            toggle(node.path)
          } else {
            onFileClick?.({ name: node.name, path: node.path })
          }
        }}
      >
        {node.type === 'directory' && (
          <button className="text-textSecondary hover:text-textPrimary transition-colors">
            {expanded[node.path] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
        )}
        {node.type === 'directory' ? (
          <Folder size={18} className="text-textSecondary group-hover:text-textPrimary transition-colors" />
        ) : (
          <FileText size={18} className="text-textSecondary group-hover:text-textPrimary transition-colors" />
        )}
        <span className="group-hover:text-textPrimary transition-colors truncate">{node.name}</span>
      </div>

      {node.type === 'directory' && expanded[node.path] && node.children && (
        <div className="border-l border-border ml-[9px]">
          {node.children.map((child) => renderNode(child, level + 1))}
        </div>
      )}
    </div>
  )

  const filteredTree = Array.isArray(tree) ? filterTree(tree) : []

  if (connectionStatus === 'connecting') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Connecting...</div>
      </div>
    )
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Disconnected. Reconnecting...</div>
      </div>
    )
  }

  if (!tree) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading file tree...</div>
      </div>
    )
  }

  if (filteredTree.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">No files found</div>
      </div>
    )
  }

  return (
    <div className="p-2 text-textPrimary text-sm overflow-y-auto h-full">
      <input
        type="text"
        placeholder="Search files..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-2 px-3 py-1.5 bg-input border border-border rounded text-sm text-textPrimary placeholder-textSecondary focus:outline-none focus:border-textSecondary transition-colors"
      />
      {filteredTree.map((node) => renderNode(node))}
    </div>
  )
}