import { collection, addDoc, getDocs, deleteDoc, Timestamp } from 'firebase/firestore'
import { db } from './firebase.js'

const POSTS_COLLECTION = 'posts'

// Realistic mock posts for disaster relief scenarios
const mockPosts = [
  {
    userName: 'Grace E.',
    userPhoto: '',
    city: 'Grambling, LA',
    type: 'request',
    caption:
      'Our home was damaged during the hurricane. The roof has collapsed and we urgently need temporary shelter and construction materials.',
    helpType: 'shelter',
    urgency: 1,
    photoUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80',
    location: { lat: 32.525, lng: -92.64 },
    targetAmount: 5900,
    currentAmount: 250,
    neededItems: [
      { name: 'Tarps', qtyNeeded: 5, qtyPledged: 1 },
      { name: 'Plywood sheets', qtyNeeded: 20, qtyPledged: 0 },
      { name: 'Nails/Tools', qtyNeeded: 10, qtyPledged: 3 },
    ],
    upvoteCount: 42,
    voters: {},
    priorityScore: 142,
    status: 'open',
    verified: true,
    createdAt: Timestamp.fromMillis(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    userName: 'Marcus T.',
    userPhoto: '',
    city: 'Monroe, LA',
    type: 'request',
    caption:
      'Running low on insulin and basic first aid supplies. Several diabetic patients in the shelter need urgent help.',
    helpType: 'medical',
    urgency: 1,
    photoUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&q=80',
    location: { lat: 32.5093, lng: -92.1193 },
    targetAmount: 1200,
    currentAmount: 800,
    neededItems: [
      { name: 'Insulin vials', qtyNeeded: 15, qtyPledged: 9 },
      { name: 'First aid kits', qtyNeeded: 10, qtyPledged: 4 },
      { name: 'Blood glucose monitors', qtyNeeded: 5, qtyPledged: 2 },
    ],
    upvoteCount: 89,
    voters: {},
    priorityScore: 189,
    status: 'open',
    verified: false,
    createdAt: Timestamp.fromMillis(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
  {
    userName: 'Sarah M.',
    userPhoto: '',
    city: 'Ruston, LA',
    type: 'situation',
    caption:
      'We have successfully set up a community food kitchen. Serving hot meals twice daily. All are welcome!',
    helpType: 'food',
    urgency: 0,
    photoUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80',
    location: { lat: 32.5232, lng: -92.6379 },
    targetAmount: 0,
    currentAmount: 0,
    neededItems: [],
    upvoteCount: 156,
    voters: {},
    priorityScore: 156,
    status: 'open',
    verified: true,
    createdAt: Timestamp.fromMillis(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  },
  {
    userName: 'James R.',
    userPhoto: '',
    city: 'West Monroe, LA',
    type: 'request',
    caption:
      'Flood waters destroyed our supplies. Families need clean drinking water and non-perishable food immediately. Any donations appreciated.',
    helpType: 'food',
    urgency: 1,
    photoUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80',
    location: { lat: 32.5171, lng: -92.1471 },
    targetAmount: 800,
    currentAmount: 320,
    neededItems: [
      { name: 'Water bottles (cases)', qtyNeeded: 100, qtyPledged: 35 },
      { name: 'Canned goods', qtyNeeded: 50, qtyPledged: 12 },
      { name: 'Baby formula', qtyNeeded: 20, qtyPledged: 8 },
    ],
    upvoteCount: 67,
    voters: {},
    priorityScore: 167,
    status: 'open',
    verified: true,
    createdAt: Timestamp.fromMillis(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
  },
  {
    userName: 'Maria G.',
    userPhoto: '',
    city: 'Choudrant, LA',
    type: 'request',
    caption:
      'Family of 6 lost everything in the storm. Need clothing, shoes, and basic household items. Children ages 4-12 need school supplies and warm clothes.',
    helpType: 'donation',
    urgency: 0,
    photoUrl: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80',
    location: { lat: 32.5282, lng: -92.5143 },
    targetAmount: 1500,
    currentAmount: 650,
    neededItems: [
      { name: "Children's clothing (sizes 4-12)", qtyNeeded: 20, qtyPledged: 8 },
      { name: 'Blankets', qtyNeeded: 10, qtyPledged: 4 },
      { name: 'Toiletries', qtyNeeded: 15, qtyPledged: 6 },
      { name: 'School backpacks', qtyNeeded: 4, qtyPledged: 1 },
    ],
    upvoteCount: 52,
    voters: {},
    priorityScore: 102,
    status: 'open',
    verified: false,
    createdAt: Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    userName: 'Robert H.',
    userPhoto: '',
    city: 'Downsville, LA',
    type: 'request',
    caption:
      'Urgent: Elderly couple trapped on second floor due to flooding. Need rescue boat or high-clearance vehicle. Water level rising.',
    helpType: 'rescue',
    urgency: 1,
    photoUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80',
    location: { lat: 32.6343, lng: -92.4154 },
    targetAmount: 0,
    currentAmount: 0,
    neededItems: [],
    upvoteCount: 203,
    voters: {},
    priorityScore: 303,
    status: 'open',
    verified: true,
    createdAt: Timestamp.fromMillis(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
  },
]

// Track if seeding is in progress to prevent concurrent calls
let isSeeding = false
let hasSeeded = false

/**
 * Seed the database with mock posts
 * Only runs if the posts collection is empty
 */
export async function seedMockData() {
  // Prevent concurrent seeding
  if (isSeeding || hasSeeded) {
    console.log('Seeding already in progress or completed')
    return
  }

  try {
    isSeeding = true

    // Check if posts already exist
    const postsSnapshot = await getDocs(collection(db, POSTS_COLLECTION))
    
    if (postsSnapshot.size > 0) {
      console.log(`Database already has ${postsSnapshot.size} posts, skipping seed`)
      hasSeeded = true
      isSeeding = false
      return
    }

    console.log('Seeding mock data...')
    
    // Add each mock post with its specific timestamp
    for (const post of mockPosts) {
      await addDoc(collection(db, POSTS_COLLECTION), post)
    }

    console.log(`✅ Successfully seeded ${mockPosts.length} mock posts`)
    hasSeeded = true
  } catch (error) {
    console.error('Error seeding mock data:', error)
  } finally {
    isSeeding = false
  }
}

/**
 * Clear all posts from the database (use with caution!)
 */
export async function clearAllPosts() {
  try {
    const postsSnapshot = await getDocs(collection(db, POSTS_COLLECTION))
    const deletePromises = postsSnapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deletePromises)
    console.log(`✅ Deleted ${postsSnapshot.size} posts`)
  } catch (error) {
    console.error('Error clearing posts:', error)
  }
}

