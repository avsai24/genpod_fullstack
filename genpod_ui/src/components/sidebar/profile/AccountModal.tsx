'use client'

import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function AccountModal({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}) {
  const { data: session } = useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Populate from session once it's available
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '')
      setEmail(session.user.email || '')
    }
  }, [session])

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
                <Dialog.Title className="text-lg font-semibold">My Account</Dialog.Title>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md transition hover:bg-input hover:ring-1 hover:ring-border"
                >
                  <X className="h-5 w-5 text-textSecondary hover:text-textPrimary" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-sm">
                <div className="flex flex-col gap-1">
                  <label className="text-textSecondary font-medium">Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-3 py-2 rounded-md border border-border bg-surface text-textPrimary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-textSecondary font-medium">Email Address</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="px-3 py-2 rounded-md border border-border bg-surface text-textPrimary"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-border flex justify-end">
                <button
                  onClick={() => console.log('Account updated')}
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