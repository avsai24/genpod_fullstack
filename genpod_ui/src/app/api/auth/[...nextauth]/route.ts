import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import GitHubProvider from 'next-auth/providers/github'
import GitLabProvider from 'next-auth/providers/gitlab'
import LinkedInProvider from 'next-auth/providers/linkedin'
import AtlassianProvider from 'next-auth/providers/atlassian'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    // ✅ Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ✅ Microsoft
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),

    // ✅ GitHub
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

    // ✅ Admin Credentials (username/password)
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'AdminCredentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔐 Admin login attempt:', credentials)
        if (
          credentials?.username === 'admin@gmail.com' &&
          credentials?.password === 'admin'
        ) {
          return {
            id: '1',
            name: 'Admin',
            email: 'admin@gmail.com',
            image: null,
          }
        }
        return null
      },
    }),

    // ✅ Firebase OTP login via ID token
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

          return {
            id: decoded.uid,
            name: decoded.name || null,
            email: decoded.email || null,
            image: decoded.picture || null,
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