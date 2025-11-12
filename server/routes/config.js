// server/routes/config.js

const express = require("express");
const router = express.Router();

// Get Google Maps API key for frontend (if needed)
// Note: In production, you might want to restrict this or use a separate client-side key
router.get("/google-maps-key", (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_KEY || process.env.GOOGLE_API_KEY || "";
  
  if (!apiKey) {
    return res.status(404).json({
      error: "API key not configured",
      message: "Google Maps API key not found in environment variables",
    });
  }

  // Return the key (in production, consider using a separate client-side key)
  res.json({
    key: apiKey,
    message: "API key retrieved successfully",
  });
});

module.exports = router;

