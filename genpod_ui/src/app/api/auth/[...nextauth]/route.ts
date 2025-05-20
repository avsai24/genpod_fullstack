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
      httpOptions: {
        timeout: 10000,
      },
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
    // Called after the OAuth provider returns
    async signIn({ user, account }) {
      const provider = account?.provider
      const email    = user.email?.toLowerCase()
      if (!provider || !email) return false

      // read signup/login intent from cookie
      let intent: string | null = null
      try {
        const cookieHeader = (await headers()).get('cookie') || ''
        intent = cookieHeader.match(/genpod-auth-intent=([^;]+)/)?.[1] ?? null
      } catch {
        intent = null
      }

      // check against your FastAPI /api/users/check
      const res    = await fetch('http://localhost:8000/api/users/check', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, provider }),
      })
      const result = await res.json()

      console.log('[NextAuth signin] intent:', intent)
      console.log('[NextAuth signin] result:', result)

      // 409 → provider mismatch
      if (res.status === 409) {
        const msg = encodeURIComponent(result.message)
        return `/login?error=provider_mismatch&message=${msg}`
      }

      // signup flow but user already exists
      if (intent === 'signup' && res.status === 200) {
        return `/login?error=already_exists`
      }

      // login flow but user not found
      if (intent !== 'signup' && res.status === 404) {
        return `/signup?error=not_found`
      }

      // all good
      return true
    },

    // Attach info into the JWT
    async jwt({ token, user, account }) {
      if (account && user) {
        const email    = user.email?.toLowerCase()
        const provider = account.provider

        try {
          const res    = await fetch('http://localhost:8000/api/users/check', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, provider }),
          })
          const result = await res.json()
          console.log('[NextAuth jwt] result:', result)

          if (res.status === 409) {
            console.warn('❌ Provider mismatch during JWT callback')
            throw new Error('provider_mismatch')
          }

          token.id       = result.user_id
          token.name     = result.username
          token.email    = result.email       
          token.provider = result.provider
        } catch (err) {
          console.error('JWT validation failed:', err)
          throw new Error('provider_mismatch')
        }
      }
      return token
    },

    // Expose only your four DB-backed fields in the session
    async session({ session, token }) {
      if (session.user) {
        // now pull from the token which carries your DB values
        session.user.id       = token.id as string
        session.user.name     = token.name as string
        session.user.email    = token.email as string
        session.user.provider = token.provider as string
        delete (session.user as any).image
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }