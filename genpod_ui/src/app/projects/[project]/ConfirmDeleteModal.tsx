'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  message?: string
  confirmText?: string
  cancelText?: string
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  message = 'Are you sure you want to delete this project? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
}: Props) {
  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl w-full max-w-sm relative">
        {/* Close (X) */}
        <button
          className="absolute top-3 right-3 text-muted-foreground hover:text-white transition"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="p-6">
          <p className="text-center text-sm text-[var(--text-primary)]">
            {message}
            </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
            >
                Delete Project
            </button>
            </div>
        </div>
      </div>
    </div>
  )
}