// types/next-auth.d.ts

import  { DefaultSession, DefaultUser } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      provider: string
      phone?: string
      first_name?: string
      last_name?: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    id: string
    provider?: string
    phone?: string
    first_name?: string
    last_name?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    name?: string
    email?: string
    picture?: string
    provider?: string
    phone?: string
    first_name?: string
    last_name?: string
    db_id?: string
  }
}