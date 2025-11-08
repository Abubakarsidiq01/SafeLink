import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from './firebase.js'
import { compressImage, compressVideo } from '../../utils/imageCompression.js'

const POSTS_COLLECTION = 'posts'

/**
 * Fetch posts with filters and pagination
 */
export async function fetchPosts({ pageParam = 0, limit: pageLimit = 20, filters = {} }) {
  try {
    const postsRef = collection(db, POSTS_COLLECTION)
    // Order by priorityScore (upvotes) first, then by createdAt for recent posts
    let q = query(postsRef, orderBy('priorityScore', 'desc'), orderBy('createdAt', 'desc'))

    // Apply filters
    if (filters.helpType) {
      q = query(q, where('helpType', '==', filters.helpType))
    }
    if (filters.urgency !== undefined) {
      q = query(q, where('urgency', '==', filters.urgency))
    }
    if (filters.mine === true) {
      const currentUserId = auth.currentUser?.uid
      if (currentUserId) {
        q = query(q, where('userId', '==', currentUserId))
      }
    }

    // Pagination
    q = query(q, limit(pageLimit))

    const snapshot = await getDocs(q)
    const currentUserId = auth.currentUser?.uid
    const posts = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        viewerHasUpvoted: currentUserId ? Boolean(data.voters?.[currentUserId]) : false,
      }
    })

    return {
      posts,
      nextCursor: posts.length === pageLimit ? pageParam + 1 : null,
    }
  } catch (error) {
    console.error('Error fetching posts:', error)
    throw error
  }
}

/**
 * Get a single post by ID
 */
export async function getPost(postId) {
  try {
    const docRef = doc(db, POSTS_COLLECTION, postId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      throw new Error('Post not found')
    }

    const data = docSnap.data()
    const currentUserId = auth.currentUser?.uid
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      viewerHasUpvoted: currentUserId ? Boolean(data.voters?.[currentUserId]) : false,
    }
  } catch (error) {
    console.error('Error fetching post:', error)
    throw error
  }
}

/**
 * Toggle upvote on a post
 */
export async function upvotePost(postId, isActive) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Must be logged in to upvote')

    const docRef = doc(db, POSTS_COLLECTION, postId)
    const voterKey = `voters.${user.uid}`

    if (isActive) {
      await updateDoc(docRef, {
        upvoteCount: increment(1),
        [voterKey]: true,
        priorityScore: increment(1),
      })
    } else {
      await updateDoc(docRef, {
        upvoteCount: increment(-1),
        [voterKey]: null,
        priorityScore: increment(-1),
      })
    }
  } catch (error) {
    console.error('Error toggling upvote:', error)
    throw error
  }
}

/**
 * Donate money to a post
 */
export async function donateMoney(postId, amount) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Must be logged in to donate')

    const docRef = doc(db, POSTS_COLLECTION, postId)
    await updateDoc(docRef, {
      currentAmount: increment(amount),
    })
  } catch (error) {
    console.error('Error donating money:', error)
    throw error
  }
}

/**
 * Donate items to a post
 */
export async function donateItems(postId, pledges) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Must be logged in to donate items')

    const docRef = doc(db, POSTS_COLLECTION, postId)
    const postSnap = await getDoc(docRef)

    if (!postSnap.exists()) throw new Error('Post not found')

    const postData = postSnap.data()
    const neededItems = postData.neededItems || []

    const updatedItems = neededItems.map((item) => {
      const pledge = pledges.find((p) => p.name === item.name)
      if (pledge) {
        return {
          ...item,
          qtyPledged: (item.qtyPledged || 0) + pledge.qty,
        }
      }
      return item
    })

    await updateDoc(docRef, {
      neededItems: updatedItems,
    })
  } catch (error) {
    console.error('Error donating items:', error)
    throw error
  }
}

/**
 * Create a new post
 * @param {Object} postData - Post fields
 * @param {File} mediaFile - Image or video file to upload
 */
export async function createPost(postData, mediaFile) {
  try {
    // Ensure user is authenticated (sign in anonymously if needed)
    let currentUser = auth.currentUser
    if (!currentUser) {
      try {
        const { signInAnonymously } = await import('firebase/auth')
        const userCredential = await signInAnonymously(auth)
        currentUser = userCredential.user
      } catch (authError) {
        console.error('Anonymous sign-in failed:', authError)
        throw new Error('Please enable anonymous authentication in Firebase Console')
      }
    }

    if (!currentUser) {
      throw new Error('Must be logged in to create post')
    }

    // Upload media - compress images to fit Firestore 1MB limit
    let photoUrl = ''
    let videoUrl = ''
    let mediaType = 'image'

    if (mediaFile) {
      const fileType = mediaFile.type
      const isVideo = fileType.startsWith('video/')
      const isImage = fileType.startsWith('image/')

      if (isVideo) {
        mediaType = 'video'
        // For video, try to compress (but videos should really use Firebase Storage)
        try {
          videoUrl = await compressVideo(mediaFile)
          
          // Check if compressed video is still too large for Firestore (1MB limit)
          const base64Size = videoUrl.length * 0.75 // Approximate binary size
          if (base64Size > 900 * 1024) { // 900KB safety margin
            throw new Error('Video file is too large. Please use a shorter video or enable Firebase Storage.')
          }
        } catch (error) {
          console.error('Video compression error:', error)
          throw new Error('Video file too large. Maximum size: 5MB. Please use Firebase Storage for videos.')
        }
      } else if (isImage) {
        // Compress image to fit within Firestore 1MB limit
        try {
          // Compress to max 500KB (safety margin for base64 overhead)
          photoUrl = await compressImage(mediaFile, 1200, 1200, 0.7, 500)
          
          // Double-check size (base64 is ~33% larger than binary)
          const base64Size = photoUrl.length * 0.75 // Approximate binary size
          if (base64Size > 900 * 1024) { // 900KB safety margin
            // Try more aggressive compression
            photoUrl = await compressImage(mediaFile, 800, 800, 0.5, 400)
          }
        } catch (error) {
          console.error('Image compression error:', error)
          throw new Error('Failed to compress image. Please try a smaller image file.')
        }
      }

      // TODO: For production, switch to Firebase Storage:
      // const storageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}_${mediaFile.name}`)
      // const uploadResult = await uploadBytes(storageRef, mediaFile)
      // const url = await getDownloadURL(uploadResult.ref)
      // if (isVideo) videoUrl = url
      // else photoUrl = url
    }

    // Get user location
    let location = { lat: 32.525, lng: -92.64 } // Default: Grambling, LA
    let city = 'Unknown location'
    
    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        })
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        
        // Reverse geocoding (simplified - can use a service later)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`
          )
          const data = await response.json()
          city = data.address?.city || data.address?.town || data.address?.village || 'Unknown location'
        } catch (geoError) {
          console.warn('Reverse geocoding failed:', geoError)
        }
      } catch (geoError) {
        console.warn('Could not get location, using default:', geoError)
      }
    }

    // Calculate priority score based on upvotes (starts at 0) and urgency
    const priorityScore = postData.urgency === 1 ? 100 : 50

    // Create post document
    const newPost = {
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Anonymous User',
      userPhoto: currentUser.photoURL || '',
      city,
      photoUrl,
      videoUrl,
      mediaType,
      currentAmount: 0,
      upvoteCount: 0,
      voters: {},
      priorityScore,
      status: 'open',
      verified: false,
      createdAt: serverTimestamp(),
      ...postData,
      location,
    }

    const docRef = await addDoc(collection(db, POSTS_COLLECTION), newPost)
    return { id: docRef.id, ...newPost }
  } catch (error) {
    console.error('Error creating post:', error)
    throw error
  }
}

