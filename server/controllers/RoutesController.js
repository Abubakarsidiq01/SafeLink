// server/controllers/RoutesController.js
// Route finding for hospitals and shelters

const axios = require("axios");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_KEY || process.env.GOOGLE_API_KEY;

// Find nearby places using Google Places API
async function findNearbyPlace(lat, lon, type) {
  // Use appropriate place types
  let placeTypes = [];
  if (type === "hospital") {
    placeTypes = ["hospital", "doctor", "pharmacy"];
  } else if (type === "police") {
    placeTypes = ["police"];
  } else {
    // For safe places, search for shelters, community centers, schools, etc.
    placeTypes = ["lodging", "establishment"]; // Will search for hotels, shelters, etc.
  }
  
  const radius = 15000; // 15km radius
  let bestPlace = null;
  let minDistance = Infinity;
  
  // Try multiple place types to find the best match
  for (const placeType of placeTypes) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=${placeType}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await axios.get(url);
      
      if (response.data.status === "OK" && response.data.results && response.data.results.length > 0) {
        // Get the closest place from this type
        const place = response.data.results[0];
        const distance = calculateDistance(
          lat, lon,
          place.geometry.location.lat,
          place.geometry.location.lng
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          bestPlace = {
            name: place.name,
            address: place.vicinity || place.formatted_address || "Address not available",
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
            rating: place.rating,
            place_id: place.place_id,
            distance: distance,
          };
        }
      }
    } catch (error) {
      console.error(`[RoutesController] Error searching for ${placeType}:`, error.message);
      // Continue to next type
    }
  }
  
  return bestPlace;
}

// Get directions using Google Directions API
async function getDirections(originLat, originLon, destLat, destLon) {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLon}&destination=${destLat},${destLon}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await axios.get(url);
    
    if (response.data.status !== "OK") {
      console.error("[RoutesController] Directions API error:", response.data.status);
      return null;
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];
    
    // Calculate distance in km
    const distanceKm = (leg.distance.value / 1000).toFixed(2);
    const duration = leg.duration.text;
    
    // Create embedded map URL
    const mapUrl = `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}&origin=${originLat},${originLon}&destination=${destLat},${destLon}`;
    
    return {
      distance: leg.distance.text,
      distance_km: distanceKm,
      duration: duration,
      eta: duration,
      map_url: mapUrl,
      steps: leg.steps.map(step => ({
        instruction: step.html_instructions,
        distance: step.distance.text,
        duration: step.duration.text,
      })),
    };
  } catch (error) {
    console.error("[RoutesController] Error getting directions:", error);
    return null;
  }
}

// Calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Main route finding function
async function findRoute(req, res) {
  try {
    const { lat, lon, intent } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: "Missing location",
        message: "Please provide latitude and longitude",
      });
    }

    if (!intent || (intent !== "hospital" && intent !== "safeplace" && intent !== "police")) {
      return res.status(400).json({
        error: "Invalid intent",
        message: "Intent must be 'hospital', 'police', or 'safeplace'",
      });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({
        error: "Missing API key",
        message: "GOOGLE_MAPS_KEY environment variable is required",
      });
    }

    console.log(`[RoutesController] 🔍 Finding ${intent} near ${lat}, ${lon}`);

    // Find nearby place
    const destination = await findNearbyPlace(parseFloat(lat), parseFloat(lon), intent);
    
    if (!destination) {
      return res.status(404).json({
        error: "No destination found",
        message: `No nearby ${intent} found. Please try a different location.`,
      });
    }

    // Get directions
    const route = await getDirections(
      parseFloat(lat),
      parseFloat(lon),
      destination.location.lat,
      destination.location.lng
    );

    if (!route) {
      return res.status(500).json({
        error: "Failed to get directions",
        message: "Could not calculate route to destination",
      });
    }

    const result = {
      destination: {
        name: destination.name,
        address: destination.address,
        distance_km: route.distance_km,
        rating: destination.rating,
      },
      route: {
        distance: route.distance,
        distance_km: route.distance_km,
        eta: route.eta,
        duration: route.duration,
        map_url: route.map_url,
        steps: route.steps,
      },
      ai_reason: intent === "hospital" 
        ? "Based on your situation, a hospital is recommended for medical attention."
        : intent === "police"
        ? "Police assistance is needed. You can also call 911 for immediate emergency help."
        : "A safe place is recommended for your current situation.",
      emergency_type: intent,
      call911: intent === "police" ? true : false,
      hazards: [], // Can be populated with real hazard data
    };

    console.log(`[RoutesController] ✅ Route found: ${destination.name} (${route.distance_km} km)`);

    res.json(result);
  } catch (error) {
    console.error("[RoutesController] ❌ Error finding route:", error);
    res.status(500).json({
      error: "Failed to find route",
      message: error.message,
    });
  }
}

module.exports = {
  findRoute,
};

