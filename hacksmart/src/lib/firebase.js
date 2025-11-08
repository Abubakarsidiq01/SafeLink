import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyAPFU5nUqKi96IU0bGeYMApkenF5sYma3g',
  authDomain: 'lifeline-61a5e.firebaseapp.com',
  projectId: 'lifeline-61a5e',
  storageBucket: 'lifeline-61a5e.firebasestorage.app',
  messagingSenderId: '248397516667',
  appId: '1:248397516667:web:ca2dfd3c13958cce9ff7de',
  measurementId: 'G-E8R4N1VCZY',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null
export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)

export default app

