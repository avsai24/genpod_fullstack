'use client'

import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'
import { Fragment, useState } from 'react'

export default function PersonaliseModal({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}) {
  const [theme, setTheme] = useState('system')
  const [fontSize, setFontSize] = useState('medium')

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-6">
          <Transition.Child
            as={Fragment}
            enter="transition duration-200 transform"
            enterFrom="scale-95 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="transition duration-150 transform"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-95 opacity-0"
          >
            <Dialog.Panel className="flex flex-col w-full max-w-xl rounded-xl bg-background border border-border shadow-xl">
              <div className="flex justify-between items-center p-6 border-b border-border">
                <Dialog.Title className="text-lg font-semibold">Personalise</Dialog.Title>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md transition hover:bg-input hover:ring-1 hover:ring-border"
                >
                  <X className="h-5 w-5 text-textSecondary hover:text-textPrimary" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-sm">
                <div className="flex flex-col gap-1">
                  <label className="text-textSecondary font-medium">Theme</label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="px-3 py-2 rounded-md border border-border bg-surface text-textPrimary"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-textSecondary font-medium">Font Size</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="px-3 py-2 rounded-md border border-border bg-surface text-textPrimary"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>

              <div className="p-4 border-t border-border flex justify-end">
                <button
                  onClick={() => console.log('Preferences saved')}
                  className="px-4 py-2 rounded-md bg-accent text-white text-sm font-medium shadow-sm hover:shadow-md hover:bg-accent-hover transition"
                >
                  Save
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}