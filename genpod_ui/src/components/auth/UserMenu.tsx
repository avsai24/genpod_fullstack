'use client'

import { signOut, useSession } from 'next-auth/react'
import { Menu } from '@headlessui/react'
import {
  LogOut,
  Settings,
  User,
  CreditCard,
  ChevronDown,
} from 'lucide-react'

export default function UserMenu() {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <Menu as="div" className="relative inline-block text-left">
      {/* GENPOD Button */}
      <Menu.Button className="flex items-center gap-2 px-3 py-1 rounded-md transition-all duration-200 ease-in-out
                              bg-surface text-text-primary hover:bg-input border border-border">
        <span className="text-sm font-semibold">GENPOD</span>
        <ChevronDown size={16} />
      </Menu.Button>

      {/* Dropdown Items */}
      <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md 
                             border shadow-sm focus:outline-none z-50 
                             bg-surface border-border text-text-primary">
        <div className="py-1 text-sm">
          <Menu.Item>
            {({ active }) => (
              <button
                className={`flex items-center w-full px-4 py-2 transition-all duration-200 ease-in-out ${
                  active ? 'bg-input' : ''
                }`}
              >
                <User size={16} className="mr-2" />
                Profile
              </button>
            )}
          </Menu.Item>

          <Menu.Item>
            {({ active }) => (
              <button
                className={`flex items-center w-full px-4 py-2 transition-all duration-200 ease-in-out ${
                  active ? 'bg-input' : ''
                }`}
              >
                <CreditCard size={16} className="mr-2" />
                Subscription
              </button>
            )}
          </Menu.Item>

          <Menu.Item>
            {({ active }) => (
              <button
                className={`flex items-center w-full px-4 py-2 transition-all duration-200 ease-in-out ${
                  active ? 'bg-input' : ''
                }`}
              >
                <Settings size={16} className="mr-2" />
                Settings
              </button>
            )}
          </Menu.Item>

          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className={`flex items-center w-full px-4 py-2 text-error transition-all duration-200 ease-in-out ${
                  active ? 'bg-error/10' : ''
                }`}
              >
                <LogOut size={16} className="mr-2" />
                Sign out
              </button>
            )}
          </Menu.Item>
        </div>
      </Menu.Items>
    </Menu>
  )
}