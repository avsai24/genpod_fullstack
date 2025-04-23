'use client'

import { useEffect, useState, useRef } from 'react'
import { Folder, FileText, ChevronDown, ChevronRight } from 'lucide-react'

interface FileTreeItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  modified?: number;
  children?: FileTreeItem[];
}

interface MessageEventData {
  data: string;
  type?: string;
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

  useEffect(() => {
    console.log('[FileTree] Tree state updated:', {
      hasTree: tree !== null,
      treeLength: tree?.length,
      connectionStatus,
      tree: tree
    })
  }, [tree, connectionStatus])

  const handleFileTreeEvent = (data: MessageEventData) => {
    try {
      console.log('[FileTree] Raw message received:', data);
      const rawData = data.data;
      console.log('[FileTree] Processing raw data:', rawData);
      
      let parsedData: FileTreeItem | FileTreeItem[];
      try {
        parsedData = JSON.parse(rawData);
        console.log('[FileTree] Successfully parsed data:', {
          isArray: Array.isArray(parsedData),
          length: Array.isArray(parsedData) ? parsedData.length : 'N/A',
          type: typeof parsedData,
          firstItem: Array.isArray(parsedData) && parsedData.length > 0 ? parsedData[0] : 'N/A'
        });
      } catch (parseError) {
        console.error('[FileTree] Error parsing data:', parseError);
        return;
      }

      // Handle both array and object formats
      let fileTreeData: FileTreeItem[];
      if (Array.isArray(parsedData)) {
        fileTreeData = parsedData;
      } else if (parsedData && typeof parsedData === 'object') {
        // If it's a single directory object, wrap it in an array
        fileTreeData = [parsedData];
      } else {
        console.error('[FileTree] Invalid data format:', parsedData);
        return;
      }

      // Filter out unwanted directories and files
      const filteredTree = fileTreeData.map(item => {
        // Skip unwanted directories and files at the root level
        if (['node_modules', '.git', 'venv', '__pycache__', '.DS_Store'].includes(item.name)) {
          return null;
        }

        // Process children if they exist
        if (item.children) {
          const filteredChildren = item.children.filter(child => 
            !['node_modules', '.git', 'venv', '__pycache__', '.DS_Store'].includes(child.name)
          );
          return { ...item, children: filteredChildren };
        }

        return item;
      }).filter((item): item is FileTreeItem => item !== null);

      console.log('[FileTree] Setting tree data:', {
        hasTree: true,
        treeLength: filteredTree.length,
        connectionStatus: 'connected',
        tree: filteredTree
      });

      setTree(filteredTree);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('[FileTree] Error handling file tree event:', error);
    }
  };

  const handleMessage = (event: MessageEvent) => {
    try {
      console.log('[FileTree] Generic message received:', event);
      
      // Check if this is a file_tree event
      if (event.type === 'file_tree') {
        handleFileTreeEvent(event);
        return;
      }

      // Handle keep-alive messages
      if (event.type === 'keep-alive') {
        console.log('[FileTree] Received keep-alive message');
        return;
      }

      // For other message types, try to parse and handle
      try {
        const data = JSON.parse(event.data);
        console.log('[FileTree] Parsed message data:', data);
        
        // Check if this is a file tree update
        if (data.event === 'file_tree') {
          handleFileTreeEvent({
            ...event,
            data: data.data
          });
        }
      } catch (parseError) {
        console.error('[FileTree] Error parsing message:', parseError);
      }
    } catch (error) {
      console.error('[FileTree] Error handling message:', error);
    }
  };

  const connectSSE = () => {
    console.log('[FileTree] Starting SSE connection...')
    if (esRef.current) {
      console.log('[FileTree] Closing existing connection')
      esRef.current.close()
    }

    // Use the full backend URL
    const backendUrl = 'http://localhost:8000'
    const es = new EventSource(`${backendUrl}/api/files/events`, {
      withCredentials: true
    })
    esRef.current = es

    console.log('[FileTree] Registering event listeners with URL:', `${backendUrl}/api/files/events`)

    es.onopen = () => {
      console.log('[FileTree] SSE connection opened')
      setConnectionStatus('connected')
    }

    // Handle all message types
    es.onmessage = handleMessage
    es.addEventListener('file_tree', handleFileTreeEvent)
    es.addEventListener('message', handleMessage)

    es.onerror = (error) => {
      console.error('[FileTree] SSE error:', error)
      setConnectionStatus('disconnected')
      
      setTimeout(() => {
        if (es.readyState === EventSource.CLOSED) {
          console.log('[FileTree] Connection closed, attempting to reconnect...')
          connectSSE()
        }
      }, 1000)
    }
  }

  useEffect(() => {
    console.log('[FileTree] Component mounted, initializing SSE...')
    connectSSE()
    return () => {
      console.log('[FileTree] Component unmounting, cleaning up SSE...')
      if (esRef.current) {
        esRef.current.close()
        esRef.current = null
      }
    }
  }, [])

  const toggle = (path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }))
  }

  const matchesSearch = (name: string) => {
    return name.toLowerCase().includes(searchTerm.toLowerCase())
  }

  const filterTree = (nodes: FileTreeItem[]): FileTreeItem[] => {
    return nodes
      .map((node) => {
        // Skip unwanted directories and files
        if (['node_modules', '.git', 'venv', '__pycache__', '.DS_Store'].includes(node.name)) {
          return null;
        }

        if (node.type === 'directory') {
          const filteredChildren = node.children ? filterTree(node.children) : [];
          if (filteredChildren.length > 0 || matchesSearch(node.name)) {
            return { ...node, children: filteredChildren };
          }
          return null;
        } else {
          return matchesSearch(node.name) ? node : null;
        }
      })
      .filter((n): n is FileTreeItem => n !== null);
  };

  const renderNode = (node: FileTreeItem, level = 0) => {
    return (
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
              {expanded[node.path] ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
            </button>
          )}
          {node.type === 'directory' ? (
            <Folder size={18} className="text-warning" />
          ) : (
            <FileText size={18} className="text-textSecondary group-hover:text-textPrimary transition-colors" />
          )}
          <span className="group-hover:text-textPrimary transition-colors truncate">
            {node.name}
          </span>
        </div>

        {node.type === 'directory' && expanded[node.path] && node.children && (
          <div className="border-l border-border ml-[9px]">
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  console.log('[FileTree] Rendering with state:', {
    connectionStatus,
    hasTree: tree !== null,
    treeLength: tree?.length
  })

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

  if (tree.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">No files found</div>
      </div>
    )
  }

  const filteredTree = filterTree(tree)

  return (
    <div className="p-2 text-textPrimary text-sm overflow-y-auto h-full">
      <input
        type="text"
        placeholder="Search files..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-2 px-3 py-1.5 bg-input border border-border rounded text-sm text-textPrimary placeholder-textSecondary focus:outline-none focus:border-textSecondary transition-colors"
      />

      {connectionStatus === 'connecting' && (
        <div className="text-textSecondary">Connecting...</div>
      )}

      {connectionStatus === 'disconnected' && (
        <div className="text-textSecondary">Disconnected. Reconnecting...</div>
      )}

      {connectionStatus === 'connected' && !tree && (
        <div className="text-textSecondary">Loading file tree...</div>
      )}

      {tree?.length === 0 && (
        <div className="text-textSecondary">No files found</div>
      )}

      {tree && tree.length > 0 && filteredTree.map((node) => renderNode(node))}
    </div>
  )
}