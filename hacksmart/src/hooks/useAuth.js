import { useEffect, useState } from 'react'
import {
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../lib/firebase.js'

/**
 * Hook to manage Firebase authentication state
 * @returns {Object} { user, loading, signInAnon, signInWithGoogle, signOut }
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signInAnon = async () => {
    try {
      const result = await signInAnonymously(auth)
      return result.user
    } catch (error) {
      console.error('Anonymous sign-in error:', error)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      return result.user
    } catch (error) {
      console.error('Google sign-in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error('Sign-out error:', error)
      throw error
    }
  }

  return {
    user,
    loading,
    signInAnon,
    signInWithGoogle,
    signOut,
  }
}

