// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import GitHubProvider from 'next-auth/providers/github'
import GitLabProvider from 'next-auth/providers/gitlab'
import LinkedInProvider from 'next-auth/providers/linkedin'

import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    // ✅ Google Login
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ✅ Microsoft Login (Azure AD)
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),

    // ✅ GitHub Login
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

    // ✅ Credentials Login (Username & Password)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔐 Login attempt with:', credentials)

        if (
          credentials?.username === 'admin@gmail.com' &&
          credentials?.password === 'admin'
        ) {
          console.log('✅ Credentials valid. Logging in as Admin')
          return {
            id: '1',
            name: 'Admin',
            email: 'admin@gmail.com',
            image: null,
          }
        }

        console.log('❌ Invalid credentials')
        return null
      },
    }),
  ],

  pages: {
    signIn: '/login',
  },

  callbacks: {
    async jwt({ token, user, profile }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.picture = user.image || (profile as any)?.picture || ''
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }