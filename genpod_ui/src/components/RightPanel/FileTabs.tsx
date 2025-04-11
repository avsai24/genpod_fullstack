'use client'

import { X } from 'lucide-react'

export type OpenFile = {
  name: string
  path: string
}

type Props = {
  openFiles: OpenFile[]
  activePath: string | null
  onSelect: (path: string) => void
  onClose: (path: string) => void
}

export default function FileTabs({ openFiles, activePath, onSelect, onClose }: Props) {
  return (
    <div className="flex bg-white border-b overflow-x-auto text-sm">
      {openFiles.map((file) => {
        const isActive = file.path === activePath

        return (
          <div
            key={file.path}
            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer border-r select-none transition-all ${
              isActive
                ? 'bg-blue-100 text-blue-800 font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => onSelect(file.path)}
          >
            <span>{file.name}</span>
            <button
              className="hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation()
                onClose(file.path)
              }}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}