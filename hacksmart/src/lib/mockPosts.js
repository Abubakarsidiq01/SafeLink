import { v4 as uuid } from 'uuid'
import { subHours } from 'date-fns'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

const subscribers = new Set()

const mockUsers = [
  { id: 'u1', name: 'Jason J.', city: 'Grambling, LA', photo: '', verified: true },
  { id: 'u2', name: 'Marvelous S.', city: 'Monroe, LA', photo: '', verified: false },
  { id: 'u3', name: 'Sarah M.', city: 'Ruston, LA', photo: '', verified: true },
]

const mockPhotos = [
  'https://images.unsplash.com/photo-1575936123452-b67c3203c357?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
]

const initialPosts = [
  {
    id: 'p1',
    userId: mockUsers[0].id,
    userName: mockUsers[0].name,
    userPhoto: mockUsers[0].photo,
    city: mockUsers[0].city,
    type: 'request',
    caption:
      'Roof collapse after storm. Our home was damaged during the hurricane. The roof has collapsed and we urgently need temporary shelter and construction materials.',
    helpType: 'shelter',
    urgency: 1,
    photoUrl: mockPhotos[0],
    location: { lat: 32.527, lng: -92.713 },
    targetAmount: 5900,
    currentAmount: 250,
    neededItems: [
      { name: 'Tarps', qtyNeeded: 20, qtyPledged: 4 },
      { name: '2x4 lumber', qtyNeeded: 60, qtyPledged: 12 },
    ],
    upvoteCount: 42,
    priorityScore: 92,
    status: 'open',
    createdAt: subHours(new Date(), 2).toISOString(),
    verified: true,
    hashtags: ['shelter', 'urgent', 'construction'],
  },
  {
    id: 'p2',
    userId: mockUsers[1].id,
    userName: mockUsers[1].name,
    userPhoto: mockUsers[1].photo,
    city: mockUsers[1].city,
    type: 'request',
    caption:
      'Medical supplies needed. Running low on insulin and basic first aid supplies. Several diabetic patients in the shelter need urgent help.',
    helpType: 'medical',
    urgency: 1,
    photoUrl: mockPhotos[1],
    location: { lat: 32.509, lng: -92.119 },
    targetAmount: 1200,
    currentAmount: 800,
    neededItems: [
      { name: 'Insulin vials', qtyNeeded: 25, qtyPledged: 18 },
      { name: 'Gauze packs', qtyNeeded: 100, qtyPledged: 30 },
    ],
    upvoteCount: 89,
    priorityScore: 87,
    status: 'open',
    createdAt: subHours(new Date(), 4).toISOString(),
    verified: true,
    hashtags: ['medical', 'urgent'],
  },
  {
    id: 'p3',
    userId: mockUsers[2].id,
    userName: mockUsers[2].name,
    userPhoto: mockUsers[2].photo,
    city: mockUsers[2].city,
    type: 'situation',
    caption:
      'Food distribution point set up. We have successfully set up a community food kitchen. Serving hot meals twice daily.',
    helpType: 'food',
    urgency: 0,
    photoUrl: mockPhotos[2],
    location: { lat: 32.523, lng: -92.640 },
    currentAmount: 0,
    neededItems: [
      { name: 'Canned beans', qtyNeeded: 200, qtyPledged: 120 },
      { name: 'Rice bags', qtyNeeded: 80, qtyPledged: 40 },
    ],
    upvoteCount: 156,
    priorityScore: 70,
    status: 'open',
    createdAt: subHours(new Date(), 6).toISOString(),
    verified: true,
    hashtags: ['food'],
  },
]

let posts = clone(initialPosts)

function notify() {
  const snapshot = clone(posts)
  subscribers.forEach((callback) => callback(snapshot))
}

function matchesFilters(post, filters) {
  const { helpType, urgency } = filters || {}
  if (helpType && helpType !== 'all' && post.helpType !== helpType) return false
  if (urgency === 1 && post.urgency !== 1) return false
  return true
}

export function getMockPosts(filters = {}) {
  return clone(posts.filter((post) => matchesFilters(post, filters)))
}

export async function fetchPosts({ pageParam = 0, limit = 10, filters = {} }) {
  const filtered = posts.filter((post) => matchesFilters(post, filters))
  const start = pageParam * limit
  const nextSlice = filtered.slice(start, start + limit)
  return {
    posts: clone(nextSlice),
    nextCursor: start + limit < filtered.length ? pageParam + 1 : null,
  }
}

export function subscribeToPosts(filters, callback) {
  const wrapped = (snapshot) => {
    const filtered = snapshot.filter((post) => matchesFilters(post, filters))
    callback(clone(filtered))
  }
  subscribers.add(wrapped)
  wrapped(posts)
  return () => {
    subscribers.delete(wrapped)
  }
}

export async function upvotePost(postId, isActive) {
  posts = posts.map((post) =>
    post.id === postId
      ? {
          ...post,
          upvoteCount: Math.max(0, post.upvoteCount + (isActive ? 1 : -1)),
          viewerHasUpvoted: isActive,
        }
      : post,
  )
  notify()
  return clone(posts.find((post) => post.id === postId))
}

export async function donateMoney(postId, amount) {
  posts = posts.map((post) => {
    if (post.id !== postId) return post
    const currentAmount = post.currentAmount + amount
    const status =
      post.targetAmount && currentAmount >= post.targetAmount ? 'fulfilled' : post.status
    return { ...post, currentAmount, status }
  })
  notify()
  return clone(posts.find((post) => post.id === postId))
}

export async function donateItems(postId, pledges) {
  posts = posts.map((post) => {
    if (post.id !== postId) return post
    const neededItems = (post.neededItems || []).map((item) => {
      const pledge = pledges.find((p) => p.name.toLowerCase() === item.name.toLowerCase())
      if (!pledge) return item
      const qtyPledged = Math.min(item.qtyNeeded, item.qtyPledged + pledge.qty)
      return { ...item, qtyPledged }
    })
    return { ...post, neededItems }
  })
  notify()
  return clone(posts.find((post) => post.id === postId))
}

export async function createPostFromCapture({ caption, helpType, urgency, photoUrl }) {
  const viewer = mockUsers[0]
  const newPost = {
    id: uuid(),
    userId: viewer.id,
    userName: viewer.name,
    userPhoto: viewer.photo,
    city: viewer.city,
    type: 'request',
    caption,
    helpType,
    urgency,
    photoUrl,
    location: { lat: 32.5, lng: -92.6 },
    targetAmount: 0,
    currentAmount: 0,
    neededItems: [],
    upvoteCount: 0,
    priorityScore: 50,
    status: 'open',
    createdAt: new Date().toISOString(),
    verified: false,
    hashtags: [helpType, urgency === 1 ? 'urgent' : null].filter(Boolean),
  }
  posts = [newPost, ...posts]
  notify()
  return clone(newPost)
}

export function getPostById(postId) {
  return clone(posts.find((post) => post.id === postId))
}

export function resetMockPosts() {
  posts = clone(initialPosts)
  notify()
}

