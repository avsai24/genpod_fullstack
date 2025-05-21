'use client'

import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'
import { Fragment, useState } from 'react'
import { motion } from 'framer-motion'
export default function GlobalUsageModal({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}) {
  const [systemPrompt, setSystemPrompt] = useState('')
  const [model, setModel] = useState('gemini-1.5-pro')
  const [temperature, setTemperature] = useState(0.7)

  const handleSave = () => {
    console.log('✅ Settings saved:', { systemPrompt, model, temperature })
    // Not closing modal on save for now
  }

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Blurred dark overlay */}
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

        {/* Modal Panel */}
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
            <Dialog.Panel className="flex flex-col w-full max-w-2xl rounded-xl bg-background border border-border shadow-xl">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-border">
                <Dialog.Title className="text-lg font-semibold">Global Usage Settings</Dialog.Title>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md transition-all duration-150 hover:bg-input hover:ring-1 hover:ring-border cursor-pointer"
                  title="Close"
                >
                  <X className="h-5 w-5 text-textSecondary hover:text-textPrimary" />
                </button>
              </div>

              {/* Form */}
              <div className="flex-1 p-6 overflow-y-auto text-sm space-y-6">
                {/* System Prompt */}
                <div className="flex flex-col gap-1">
                  <label className="text-textSecondary font-medium">System Prompt</label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm text-textPrimary resize-none"
                    placeholder="e.g. You are a helpful assistant..."
                  />
                </div>

                {/* LLM Model */}
                <div className="flex flex-col gap-1">
                  <label className="text-textSecondary font-medium">LLM Model</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm text-textPrimary"
                  >
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>

                {/* Temperature */}
                <div className="flex flex-col gap-2">
                  <label className="text-textSecondary font-medium flex justify-between">
                    <span>Temperature</span>
                    <span className="text-textPrimary font-mono">{temperature.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-accent"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border flex justify-end">
                <motion.button
  onClick={handleSave}
  whileTap={{ scale: 0.95 }}
  whileHover={{ scale: 1.05 }}
  transition={{ type: 'spring', stiffness: 250, damping: 20 }}
  className="px-4 py-2 rounded-md bg-accent text-white text-sm font-semibold 
             shadow-sm hover:shadow-lg hover:bg-accent-hover 
             transition-all duration-200 ease-in-out cursor-pointer"
>
  Save
</motion.button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}