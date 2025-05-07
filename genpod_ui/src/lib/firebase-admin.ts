// src/lib/firebase-admin.ts
import { getApps, initializeApp, cert } from 'firebase-admin/app'

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)

export const firebaseAdminApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount),
    })