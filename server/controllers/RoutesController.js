// server/controllers/RoutesController.js
// Route finding for hospitals and shelters

const axios = require("axios");

// Use OpenStreetMap/Nominatim (free, no API key required)
// Fallback to Google Maps if API key is provided
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_KEY || process.env.GOOGLE_API_KEY;

// Find multiple nearby places - prioritize Google Places API if key is available
async function findNearbyShelters(lat, lon, type, limit = 10) {
  const places = [];
  
  // Prioritize Google Places API if key is available
  if (GOOGLE_MAPS_API_KEY) {
    try {
      let googleTypes = [];
      if (type === "hospital") {
        googleTypes = ["hospital", "doctor", "pharmacy"];
      } else if (type === "police") {
        googleTypes = ["police"];
      } else {
        googleTypes = ["lodging", "establishment"];
      }
      
      // Try each type
      for (const googleType of googleTypes) {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=15000&type=${googleType}&key=${GOOGLE_MAPS_API_KEY}`;
        
        const response = await axios.get(url);
        
        if (response.data.status === "OK" && response.data.results && response.data.results.length > 0) {
          for (const place of response.data.results) {
            const placeLat = place.geometry.location.lat;
            const placeLon = place.geometry.location.lng;
            const distance = calculateDistance(lat, lon, placeLat, placeLon);
            
            // Avoid duplicates
            if (!places.find(p => p.place_id === place.place_id)) {
              places.push({
                name: place.name,
                address: place.vicinity || place.formatted_address || "Address not available",
                location: {
                  lat: placeLat,
                  lng: placeLon,
                },
                rating: place.rating,
                place_id: place.place_id,
                distance: distance,
                types: place.types || [],
              });
            }
          }
        }
      }
      
      // Sort by distance and limit
      places.sort((a, b) => a.distance - b.distance);
      return places.slice(0, limit);
    } catch (error) {
      console.error(`[RoutesController] Error searching Google Places:`, error.message);
    }
  }
  
  // Fallback to Nominatim if no Google results or no API key
  if (places.length === 0) {
    let searchTerms = [];
    if (type === "hospital") {
      searchTerms = ["hospital", "clinic", "medical center", "emergency room"];
    } else if (type === "police") {
      searchTerms = ["police station", "police department", "sheriff"];
    } else {
      searchTerms = ["shelter", "community center", "safe place", "refuge"];
    }
    
    for (const searchTerm of searchTerms) {
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&lat=${lat}&lon=${lon}&radius=15&limit=5`;
        const response = await axios.get(nominatimUrl, {
          headers: {
            'User-Agent': 'SafeLink-Mesh-AI/1.0'
          },
          timeout: 10000
        });
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          for (const place of response.data) {
            const placeLat = parseFloat(place.lat);
            const placeLon = parseFloat(place.lon);
            const distance = calculateDistance(lat, lon, placeLat, placeLon);
            
            if (!places.find(p => p.place_id === place.place_id || p.place_id === place.osm_id)) {
              places.push({
                name: place.display_name?.split(',')[0] || place.name || `${type} facility`,
                address: place.display_name || `${placeLat.toFixed(6)}, ${placeLon.toFixed(6)}`,
                location: {
                  lat: placeLat,
                  lng: placeLon,
                },
                rating: null,
                place_id: place.place_id || place.osm_id,
                distance: distance,
                types: [],
              });
            }
          }
        }
      } catch (error) {
        console.error(`[RoutesController] Error searching Nominatim for ${searchTerm}:`, error.message);
      }
    }
  }
  
  // Sort by distance and limit
  places.sort((a, b) => a.distance - b.distance);
  return places.slice(0, limit);
}

// Find nearby places using Nominatim (OpenStreetMap, free, no key required)
// Keep for backward compatibility
async function findNearbyPlace(lat, lon, type) {
  const places = await findNearbyShelters(lat, lon, type, 1);
  return places.length > 0 ? places[0] : null;
}

// Get directions using OSRM (Open Source Routing Machine, free, no key required) or Google Maps
async function getDirections(originLat, originLon, destLat, destLon) {
  // Try OSRM first (free, open source, no API key needed)
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=full&alternatives=false&steps=true&geometries=geojson`;
    const response = await axios.get(osrmUrl, { timeout: 10000 });
    
    if (response.data && response.data.code === "Ok" && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      
      const distanceKm = (route.distance / 1000).toFixed(2);
      const durationMinutes = Math.round(route.duration / 60);
      const duration = `${durationMinutes} min`;
      
      // Create map URL using OpenStreetMap
      const mapUrl = `https://www.openstreetmap.org/directions?from=${originLat},${originLon}&to=${destLat},${destLon}`;
      
      // Extract steps
      const steps = [];
      if (route.legs && route.legs[0] && route.legs[0].steps) {
        route.legs[0].steps.slice(0, 10).forEach((step, index) => {
          const stepDistance = step.distance ? (step.distance / 1000).toFixed(2) : "0";
          const stepDuration = step.duration ? Math.round(step.duration / 60) : 1;
          steps.push({
            instruction: step.maneuver?.instruction || step.maneuver?.modifier || `Step ${index + 1}: Continue`,
            distance: `${stepDistance} km`,
            duration: `${stepDuration} min`,
          });
        });
      }
      
      return {
        distance: `${distanceKm} km`,
        distance_km: distanceKm,
        duration: duration,
        eta: duration,
        map_url: mapUrl,
        geometry: route.geometry, // Include route geometry for Leaflet
        steps: steps.length > 0 ? steps : [
          {
            instruction: `Navigate to destination (${distanceKm} km away)`,
            distance: `${distanceKm} km`,
            duration: duration,
          }
        ],
      };
    }
  } catch (error) {
    console.error("[RoutesController] Error getting directions from OSRM:", error.message);
  }
  
  // Prioritize Google Maps if API key is available
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLon}&destination=${destLat},${destLon}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await axios.get(url);
      
      if (response.data.status === "OK" && response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];
        
        const distanceKm = (leg.distance.value / 1000).toFixed(2);
        const duration = leg.duration.text;
        
        // Create Google Maps URL for directions
        const mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${destLat},${destLon}`;
        
        // Get encoded polyline for map display
        const polyline = route.overview_polyline?.points || null;
        
        return {
          distance: leg.distance.text,
          distance_km: parseFloat(distanceKm),
          duration: duration,
          eta: duration,
          map_url: mapUrl,
          polyline: polyline,
          steps: leg.steps.map(step => ({
            instruction: step.html_instructions,
            distance: step.distance.text,
            duration: step.duration.text,
          })),
        };
      }
    } catch (error) {
      console.error("[RoutesController] Error getting directions from Google:", error.message);
    }
  }
  
  // Final fallback: Calculate straight-line distance and create basic route
  const distanceKm = calculateDistance(originLat, originLon, destLat, destLon).toFixed(2);
  const estimatedMinutes = Math.round(parseFloat(distanceKm) * 2); // Rough estimate: 2 min per km
  
  return {
    distance: `${distanceKm} km`,
    distance_km: distanceKm,
    duration: `${estimatedMinutes} min`,
    eta: `${estimatedMinutes} min`,
    map_url: `https://www.openstreetmap.org/directions?from=${originLat},${originLon}&to=${destLat},${destLon}`,
    steps: [
      {
        instruction: `Head towards destination (${distanceKm} km away)`,
        distance: `${distanceKm} km`,
        duration: `${estimatedMinutes} min`,
      }
    ],
  };
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

// Find multiple shelters endpoint
async function findShelters(req, res) {
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

    console.log(`[RoutesController] 🔍 Finding multiple ${intent} near ${lat}, ${lon}`);

    // Find multiple nearby places
    const shelters = await findNearbyShelters(parseFloat(lat), parseFloat(lon), intent, 10);
    
    if (shelters.length === 0) {
      return res.status(404).json({
        error: "No shelters found",
        message: `No nearby ${intent} found. Please try a different location.`,
        shelters: [],
      });
    }

    console.log(`[RoutesController] ✅ Found ${shelters.length} ${intent}`);

    res.json({
      success: true,
      shelters: shelters,
      count: shelters.length,
      intent: intent,
    });
  } catch (error) {
    console.error("[RoutesController] ❌ Error finding shelters:", error);
    res.status(500).json({
      error: "Failed to find shelters",
      message: error.message,
    });
  }
}

module.exports = {
  findRoute,
  findShelters,
};

