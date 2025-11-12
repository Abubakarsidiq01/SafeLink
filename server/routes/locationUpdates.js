// server/routes/locationUpdates.js

const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

const DATA_FILE = path.join(__dirname, "../data/locationUpdates.json");

// Ensure data file exists
async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }
}

// Get all location updates
router.get("/", async (req, res) => {
  try {
    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE, "utf8");
    const updates = JSON.parse(data);
    
    // Filter by status if provided
    const status = req.query.status;
    const filtered = status && status !== "all" 
      ? updates.filter((u) => u.status === status)
      : updates;
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(filtered);
  } catch (error) {
    console.error("Error fetching location updates:", error);
    res.status(500).json({ error: "Failed to fetch location updates" });
  }
});

// Create a new location update
router.post("/", async (req, res) => {
  try {
    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE, "utf8");
    const updates = JSON.parse(data);
    
    const update = {
      id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      status: req.body.status || "safe",
      message: req.body.message || "",
      address: req.body.address || "Location detected",
      timestamp: req.body.timestamp || new Date().toISOString(),
      reporter: req.body.reporter || "Anonymous",
    };
    
    updates.push(update);
    await fs.writeFile(DATA_FILE, JSON.stringify(updates, null, 2));
    
    res.status(201).json(update);
  } catch (error) {
    console.error("Error creating location update:", error);
    res.status(500).json({ error: "Failed to create location update" });
  }
});

// Get location updates by location (within radius)
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lon, radius = 5 } = req.query; // radius in km
    
    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and longitude required" });
    }
    
    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE, "utf8");
    const updates = JSON.parse(data);
    
    // Filter by distance
    const nearby = updates.filter((update) => {
      if (!update.latitude || !update.longitude) return false;
      
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lon),
        update.latitude,
        update.longitude
      );
      
      return distance <= parseFloat(radius);
    });
    
    res.json(nearby);
  } catch (error) {
    console.error("Error fetching nearby updates:", error);
    res.status(500).json({ error: "Failed to fetch nearby updates" });
  }
});

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

module.exports = router;

