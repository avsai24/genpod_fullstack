import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import GitHubProvider from 'next-auth/providers/github'
import GitLabProvider from 'next-auth/providers/gitlab'
import LinkedInProvider from 'next-auth/providers/linkedin'
import AtlassianProvider from 'next-auth/providers/atlassian'
import { headers } from 'next/headers'
import type { NextAuthOptions } from 'next-auth'

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
      authorization: {
        params: { scope: 'r_liteprofile r_emailaddress' },
      },
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
      async authorize(credentials) {
        const token = credentials?.token
        if (!token) return null
        try {
          const { getAuth } = await import('firebase-admin/auth')
          const { firebaseAdminApp } = await import('@/lib/firebase-admin')
          const decoded = await getAuth(firebaseAdminApp).verifyIdToken(token)

          console.log('✅ Firebase decoded token:', decoded)

          return {
            id: decoded.uid,
            name: decoded.name || '',
            email: decoded.email || null,
            phone: decoded.phone_number || '', // ✅ ensure phone is returned
            image: decoded.picture || '',
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
      const phone = (user as any)?.phone

      // Read intent cookie safely (Next.js app router)
      const cookieHeader = (await headers()).get('cookie') || ''
      const match = cookieHeader.match(/genpod-auth-intent=([^;]+)/)
      const intent = match?.[1] || null

      console.log('🧪 Auth callback - provider:', provider)
      console.log('🧪 Email:', email)
      console.log('🧪 Phone:', phone)
      console.log('🧪 Intent:', intent)

      if (!provider) return false

      try {
        const body = isPhone
          ? { phone, provider }
          : { email, provider }

        const res = await fetch('http://localhost:8000/api/users/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        const result = await res.json()
        console.log('🧪 Backend check result:', result)

        // 🚫 Prevent signup if account exists already
        if (intent === 'signup' && result.ok) {
          console.warn('🛑 Account already exists — blocking duplicate signup')
          return '/login?error=already_exists'
        }

        // 🚫 Prevent login if account not found
        if (intent !== 'signup' && !result.ok && result.message?.toLowerCase().includes('not found')) {
          console.warn('🛑 No account found — blocking login')
          return '/signup?error=not_found'
        }

        return true
      } catch (err) {
        console.error('❌ signIn check failed:', err)
        return '/login?error=server_error'
      }
    },

    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.picture = user.image || (profile as any)?.picture || ''
        token.provider = account?.provider
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.picture as string
        session.user.provider = token.provider as string
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }