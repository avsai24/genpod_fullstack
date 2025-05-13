import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

const DB_PATH = '/Users/venkatasaiancha/Documents/captenai/genpod_UI/genpod_backend/users.db'

// Type definition for your user row
export type UserRow = {
  id: string
  auth_id: string
  provider: string
  username: string
  created_at: string
}

export async function getUserByAuthId(authId: string): Promise<UserRow | undefined> {
  const normalizedAuthId = authId.trim().toLowerCase() // ✅ Normalize for reliable lookup

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  })

  const user = await db.get<UserRow>(
    'SELECT * FROM users WHERE auth_id = ?',
    normalizedAuthId
  )

  return user ?? undefined
}