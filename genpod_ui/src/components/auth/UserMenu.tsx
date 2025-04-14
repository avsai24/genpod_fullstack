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
      <Menu.Button className="flex items-center gap-2 px-3 py-1 rounded-md transition 
                              bg-white text-black hover:bg-gray-200
                              dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#2a2a2a]">
        <span className="text-sm font-semibold">GENPOD</span>
        <ChevronDown size={16} />
      </Menu.Button>

      {/* Dropdown Items */}
      <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md 
                             border shadow-lg focus:outline-none z-50 
                             bg-white border-gray-200 text-black
                             dark:bg-[#1a1a1a] dark:border-[#2a2a2a] dark:text-white">
        <div className="py-1 text-sm">
          <Menu.Item>
            {({ active }) => (
              <button
                className={`flex items-center w-full px-4 py-2 ${
                  active ? 'bg-gray-100 dark:bg-[#2a2a2a]' : ''
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
                className={`flex items-center w-full px-4 py-2 ${
                  active ? 'bg-gray-100 dark:bg-[#2a2a2a]' : ''
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
                className={`flex items-center w-full px-4 py-2 ${
                  active ? 'bg-gray-100 dark:bg-[#2a2a2a]' : ''
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
                className={`flex items-center w-full px-4 py-2 text-red-500 hover:text-white ${
                  active ? 'bg-red-100 dark:bg-red-600' : ''
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