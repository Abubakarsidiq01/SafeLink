import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db, auth } from './firebase.js'

const USERS_COLLECTION = 'users'

export async function getUserProfile(uid) {
  const ref = doc(db, USERS_COLLECTION, uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function ensureUserProfile({ name, city, location }) {
  const user = auth.currentUser
  if (!user) throw new Error('No authenticated user')
  const ref = doc(db, USERS_COLLECTION, user.uid)
  const snap = await getDoc(ref)
  const base = {
    name: name || user.displayName || 'User',
    city: city || '',
    location: location || null,
    photo: user.photoURL || '',
    email: user.email || '',
    createdAt: new Date(),
  }
  if (!snap.exists()) {
    await setDoc(ref, base)
    return { id: ref.id, ...base }
  }
  return { id: ref.id, ...snap.data() }
}

export async function updateUserProfile(updates) {
  const user = auth.currentUser
  if (!user) throw new Error('No authenticated user')
  const ref = doc(db, USERS_COLLECTION, user.uid)
  await updateDoc(ref, updates)
}


