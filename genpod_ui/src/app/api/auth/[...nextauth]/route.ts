import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import GitHubProvider from 'next-auth/providers/github'
import GitLabProvider from 'next-auth/providers/gitlab'
import LinkedInProvider from 'next-auth/providers/linkedin'
import AtlassianProvider from 'next-auth/providers/atlassian'
import type { NextAuthOptions, User } from 'next-auth'
import { headers } from 'next/headers'

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
  ],

  pages: {
    signIn: '/login',
  },

  callbacks: {
    async signIn({ user, account }) {
        const provider = account?.provider
        const email    = user.email?.toLowerCase()
        if (!provider || !email) return false

        let intent: string | null = null
        try {
          const cookieHeader = (await headers()).get('cookie') || ''
          intent = cookieHeader.match(/genpod-auth-intent=([^;]+)/)?.[1] ?? null
        } catch {
          intent = null
        }

        // call your FastAPI /api/users/check
        const res    = await fetch('http://localhost:8000/api/users/check', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, provider }),
        })
        const result = await res.json()

        console.log('[NextAuth signin] intent:', intent)
        console.log('[NextAuth signin] result:', result)

        // 409 = provider mismatch
        if (res.status === 409) {
          const msg = encodeURIComponent(result.message)
          // redirect to your error page
          return `/login?error=provider_mismatch&message=${msg}`
        }

        // trying to sign up but user already exists
        if (intent === 'signup' && res.status === 200) {
          return `/login?error=already_exists`
        }

        // trying to log in but user not found
        if (intent !== 'signup' && res.status === 404) {
          return `/signup?error=not_found`
        }

        // everything’s OK
        return true
      },

    async jwt({ token, user, account }) {
      if (account && user) {
        const email = user.email?.toLowerCase()
        const provider = account.provider

        try {
          const res = await fetch('http://localhost:8000/api/users/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, provider }),
          })

          const result = await res.json()

          if (!result.ok && result.message?.toLowerCase().includes('originally created using')) {
            console.warn('❌ Provider mismatch during JWT callback')
            throw new Error('provider_mismatch') // ✅ Throw to stop token + session
          }

          token.id = user.id
          token.name = user.name || ''
          token.email = user.email || ''
          token.provider = provider
        } catch (err) {
          console.error('JWT validation failed:', err)
          throw new Error('provider_mismatch') // ✅ This will prevent session
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.provider = token.provider ?? ''
        delete (session.user as any).image
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }