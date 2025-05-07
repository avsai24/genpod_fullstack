import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyAoHvEDn3PFQ43S9PZTREm-kveIk8H7_kc",
  authDomain: "genpod-aba58.firebaseapp.com",
  projectId: "genpod-aba58",
  storageBucket: "genpod-aba58.appspot.com",
  messagingSenderId: "661219506797",
  appId: "1:661219506797:web:755a454ed3362aaf06dd64",
  measurementId: "G-PDT3JMEWLZ"
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)

export { app, auth }