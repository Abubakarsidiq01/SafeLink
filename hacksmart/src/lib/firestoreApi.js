import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  increment,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage, auth } from './firebase.js'

const POSTS_COLLECTION = 'posts'

// ==================== POSTS ====================

/**
 * Fetch posts with filters and pagination
 * @param {Object} options
 * @param {number} options.pageParam - Cursor for pagination
 * @param {number} options.limit - Number of posts per page
 * @param {Object} options.filters - { helpType?, urgency? }
 */
export async function fetchPosts({ pageParam = 0, limit: pageLimit = 10, filters = {} }) {
  try {
    const postsRef = collection(db, POSTS_COLLECTION)
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

    if (pageParam > 0) {
      // In real pagination, you'd pass the last doc snapshot
      // For simplicity, we're using offset-based (not ideal for Firestore)
      // Better: store lastVisible doc and use startAfter(lastVisible)
    }

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
 * Subscribe to real-time posts updates
 * @param {Object} filters - { helpType?, urgency? }
 * @param {Function} callback - Called with updated posts array
 * @returns {Function} Unsubscribe function
 */
export function subscribeToPosts(filters = {}, callback) {
  const postsRef = collection(db, POSTS_COLLECTION)
  let q = query(postsRef, orderBy('priorityScore', 'desc'), orderBy('createdAt', 'desc'))

  if (filters.helpType) {
    q = query(q, where('helpType', '==', filters.helpType))
  }
  if (filters.urgency !== undefined) {
    q = query(q, where('urgency', '==', filters.urgency))
  }

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    }))
    callback(posts)
  })
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
 * Create a new post
 * @param {Object} postData - Post fields
 * @param {File} imageFile - Image file to upload
 */
export async function createPost(postData, imageFile) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Must be logged in to create post')

    // Upload image - using base64 for now (Storage CORS not configured yet)
    let photoUrl = ''
    if (imageFile) {
      // TODO: Switch to Firebase Storage once rules are deployed
      // For now, use base64 to avoid CORS issues
      console.log('Using base64 image encoding (Storage not configured)')
      photoUrl = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(imageFile)
      })
      
      // Uncomment this once Storage rules are deployed:
      // const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${imageFile.name}`)
      // const uploadResult = await uploadBytes(storageRef, imageFile)
      // photoUrl = await getDownloadURL(uploadResult.ref)
    }

    // Create post document
    const newPost = {
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      userPhoto: user.photoURL || '',
      city: 'Grambling, LA', // Default location, could be enhanced with reverse geocoding
      photoUrl,
      currentAmount: 0,
      upvoteCount: 0,
      voters: {},
      priorityScore: postData.urgency === 1 ? 100 : 50,
      status: 'open',
      verified: false,
      createdAt: serverTimestamp(),
      ...postData,
    }

    const docRef = await addDoc(collection(db, POSTS_COLLECTION), newPost)
    return { id: docRef.id, ...newPost }
  } catch (error) {
    console.error('Error creating post:', error)
    throw error
  }
}

/**
 * Update a post
 */
export async function updatePost(postId, updates) {
  try {
    const docRef = doc(db, POSTS_COLLECTION, postId)
    await updateDoc(docRef, updates)
  } catch (error) {
    console.error('Error updating post:', error)
    throw error
  }
}

/**
 * Delete a post
 */
export async function deletePost(postId) {
  try {
    const docRef = doc(db, POSTS_COLLECTION, postId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting post:', error)
    throw error
  }
}

// ==================== UPVOTES ====================

/**
 * Toggle upvote on a post
 * @param {string} postId
 * @param {boolean} isActive - true to upvote, false to remove
 */
export async function upvotePost(postId, isActive) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Must be logged in to upvote')

    const docRef = doc(db, POSTS_COLLECTION, postId)
    const voterKey = `voters.${user.uid}`

    if (isActive) {
      // Add upvote
      await updateDoc(docRef, {
        upvoteCount: increment(1),
        [voterKey]: true,
        priorityScore: increment(1),
      })
    } else {
      // Remove upvote
      await updateDoc(docRef, {
        upvoteCount: increment(-1),
        [voterKey]: null, // Remove field
        priorityScore: increment(-1),
      })
    }
  } catch (error) {
    console.error('Error toggling upvote:', error)
    throw error
  }
}

// ==================== DONATIONS ====================

/**
 * Donate money to a post
 * @param {string} postId
 * @param {number} amount
 */
export async function donateMoney(postId, amount) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Must be logged in to donate')

    const docRef = doc(db, POSTS_COLLECTION, postId)

    // Update post amount
    await updateDoc(docRef, {
      currentAmount: increment(amount),
    })

    // Optionally: Create a donations sub-collection for tracking
    // await addDoc(collection(db, `${POSTS_COLLECTION}/${postId}/donations`), {
    //   userId: user.uid,
    //   userName: user.displayName || 'Anonymous',
    //   amount,
    //   createdAt: serverTimestamp(),
    // })
  } catch (error) {
    console.error('Error donating money:', error)
    throw error
  }
}

/**
 * Donate items to a post
 * @param {string} postId
 * @param {Array} pledges - [{ name, qty }]
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

    // Update pledged quantities
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

    // Optionally: Create item pledges sub-collection
    // await addDoc(collection(db, `${POSTS_COLLECTION}/${postId}/itemPledges`), {
    //   userId: user.uid,
    //   userName: user.displayName || 'Anonymous',
    //   pledges,
    //   createdAt: serverTimestamp(),
    // })
  } catch (error) {
    console.error('Error donating items:', error)
    throw error
  }
}

// ==================== HELPERS ====================

/**
 * Upload image to Firebase Storage
 * @param {File} file
 * @param {string} path - Storage path
 * @returns {Promise<string>} Download URL
 */
export async function uploadImage(file, path) {
  try {
    const storageRef = ref(storage, path)
    const uploadResult = await uploadBytes(storageRef, file)
    return await getDownloadURL(uploadResult.ref)
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

