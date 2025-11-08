# Mock Data Setup 🎭

## What's Included

I've added **8 realistic disaster relief posts** that will automatically populate your feed:

### Posts Include:
1. 🏠 **Roof Collapse** - Urgent shelter need (Grambling, LA)
2. 💊 **Medical Supplies** - Insulin shortage (Monroe, LA)
3. 🍲 **Food Distribution** - Community kitchen success story (Ruston, LA)
4. 💧 **Clean Water** - Flood damage, water needed (West Monroe, LA)
5. ⚡ **Power Outage** - Generators for medical equipment (Jonesboro, LA)
6. 🛠️ **Volunteer Cleanup** - Organizing repair teams (Farmerville, LA)
7. 👕 **Family Donations** - Clothing and supplies (Choudrant, LA)
8. 🚨 **Rescue Request** - Elderly couple trapped (Downsville, LA)

All posts use **real Unsplash images** related to disasters, medical needs, and community support.

---

## How It Works

### Automatic Seeding
- On first app load, checks if database is empty
- If empty, adds all 8 mock posts
- If posts exist, does nothing (won't duplicate)

### Features
- ✅ Realistic names and locations
- ✅ Mix of urgent and non-urgent posts
- ✅ Various help types (shelter, medical, food, water, etc.)
- ✅ Donation progress bars
- ✅ Item pledge lists
- ✅ Upvote counts
- ✅ Verified badges
- ✅ Timestamps (ranging from 1 hour to 1 day ago)

---

## Testing

### See Mock Data
1. **Clear your Firestore database** (if you want fresh data):
   - Go to Firebase Console → Firestore
   - Delete all documents in `posts` collection
2. **Refresh your app**
3. Mock posts will automatically appear!

### Check Console
You'll see: `✅ Successfully seeded 8 mock posts`

---

## Managing Mock Data

### To Clear All Posts
Open browser console and run:
```javascript
import { clearAllPosts } from './lib/seedMockData.js'
clearAllPosts()
```

Or manually delete from Firebase Console.

### To Add More Mock Posts
Edit `src/lib/seedMockData.js` and add to the `mockPosts` array.

### To Disable Auto-Seeding
Remove these lines from `src/App.jsx`:
```javascript
useEffect(() => {
  seedMockData()
}, [])
```

---

## Image Sources

All images are from **Unsplash** (free to use):
- Disaster/flood scenes
- Medical supplies
- Community kitchens
- Volunteers helping

Images will load from Unsplash CDN (requires internet).

---

## For Production

Before launching, you may want to:
1. Remove the auto-seed code from `App.jsx`
2. Delete mock posts from Firestore
3. Let real users create real posts

Or keep a few as examples! 🎯

