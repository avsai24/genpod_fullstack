'use client'

import { signOut, useSession } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export default function UserMenu() {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <div className="flex items-center gap-3 text-sm text-white">
      <span className="hidden sm:block text-sm text-gray-800">{session.user?.email}</span>
      <button
        onClick={() => signOut()}
        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md flex items-center gap-1 text-xs"
      >
        <LogOut size={14} />
        Sign out
      </button>
    </div>
  )
}