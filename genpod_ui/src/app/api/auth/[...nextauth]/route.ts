import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import GitHubProvider from 'next-auth/providers/github'
import GitLabProvider from 'next-auth/providers/gitlab'
import LinkedInProvider from 'next-auth/providers/linkedin'
import AtlassianProvider from 'next-auth/providers/atlassian'
import { headers } from 'next/headers'
import type { NextAuthOptions, User } from 'next-auth'
import type { DecodedIdToken } from 'firebase-admin/auth'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GitLabProvider({
      clientId: process.env.GITLAB_CLIENT_ID!,
      clientSecret: process.env.GITLAB_CLIENT_SECRET!,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: { params: { scope: 'r_liteprofile r_emailaddress' } },
    }),
    AtlassianProvider({
      clientId: process.env.ATLASSIAN_CLIENT_ID!,
      clientSecret: process.env.ATLASSIAN_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: 'firebase-otp',
      name: 'FirebasePhone',
      credentials: {
        token: { label: 'Firebase ID Token', type: 'text' },
      },
      async authorize(credentials): Promise<User | null> {
        const token = credentials?.token
        if (!token) return null
        try {
          const { getAuth } = await import('firebase-admin/auth')
          const { firebaseAdminApp } = await import('@/lib/firebase-admin')
          const decoded: DecodedIdToken = await getAuth(firebaseAdminApp).verifyIdToken(token)

          return {
            id: decoded.uid,
            name: decoded.name || '',
            email: decoded.email || '',
            phone: decoded.phone_number || '',
          }
        } catch (err) {
          console.error('❌ Firebase token verification failed:', err)
          return null
        }
      },
    }),
  ],

  pages: {
    signIn: '/login',
  },

  callbacks: {
    async signIn({ user, account }) {
      const provider = account?.provider
      const isPhone = provider === 'firebase-otp'
      const email = user.email
      const phone = (user as { phone?: string })?.phone
    
      const cookieHeader = (await headers()).get('cookie') || ''
      const match = cookieHeader.match(/genpod-auth-intent=([^;]+)/)
      const intent = match?.[1] || null
    
      if (!provider) return false
    
      try {
        const body = isPhone ? { phone, provider } : { email, provider }
    
        const res = await fetch('http://localhost:8000/api/users/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
    
        const result = await res.json()
    
        if (intent === 'signup' && result.ok) {
          // Already registered — can't signup again
          throw new Error('/login?error=already_exists')
        }
    
        if (intent !== 'signup' && !result.ok && result.message?.toLowerCase().includes('not found')) {
          throw new Error('/signup?error=not_found')
        }
    
        if (!result.ok && result.message?.toLowerCase().includes('authentication method')) {
          const msg = encodeURIComponent(result.message)
          throw new Error(`/login?error=provider_mismatch&message=${msg}`)
        }
    
        return true
      } catch (err: any) {
        // ✅ Stop login and redirect user
        if (typeof err.message === 'string' && err.message.startsWith('/')) {
          return err.message
        }
        console.error('❌ signIn check failed:', err)
        return '/login?error=server_error'
      }
    },

    async jwt({ token, user, account }) {
      if (user) {
        const u = user as User & {
          phone?: string
          provider?: string
        }
        token.id = u.id
        token.name = u.name || ''
        token.email = u.email || ''
        token.phone = u.phone || ''
        token.provider = account?.provider
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.phone = token.phone
        session.user.provider = token.provider ?? ''
        delete (session.user as any).image // ✅ Explicitly remove profile image
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }