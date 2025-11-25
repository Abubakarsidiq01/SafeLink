// src/pages/FindShelter.jsx

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./FindShelter.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function FindShelter() {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [findingShelters, setFindingShelters] = useState(false);
  const [intent, setIntent] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Load Google Maps script - get API key from backend
  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (window.google) {
        setMapLoaded(true);
        return;
      }

      try {
        // Get API key from backend
        const response = await fetch(`${API_BASE}/api/config/google-maps-key`);
        let apiKey = "";
        
        if (response.ok) {
          const data = await response.json();
          apiKey = data.key || "";
        } else {
          // Fallback to env variable
          apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";
        }

        if (!apiKey) {
          setError("Google Maps API key not configured. Please add GOOGLE_MAPS_KEY to your .env file.");
          return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setMapLoaded(true);
        };
        script.onerror = () => {
          setError("Failed to load Google Maps. Please check your API key.");
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error("Error loading Google Maps:", error);
        setError("Failed to load Google Maps configuration.");
      }
    };

    loadGoogleMaps();
  }, []);

  // Initialize map when location is available
  useEffect(() => {
    if (mapLoaded && coords && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [mapLoaded, coords]);

  // Update map when shelters change
  useEffect(() => {
    if (mapInstanceRef.current && shelters.length > 0) {
      updateMapMarkers();
    }
  }, [shelters, coords]);

  const initializeMap = () => {
    if (!window.google || !coords) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: coords.lat, lng: coords.lon },
      zoom: 13,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    // Add user location marker
    new window.google.maps.Marker({
      position: { lat: coords.lat, lng: coords.lon },
      map: map,
      title: "Your Location",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    mapInstanceRef.current = map;
  };

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add user location marker
    if (coords) {
      const userMarker = new window.google.maps.Marker({
        position: { lat: coords.lat, lng: coords.lon },
        map: mapInstanceRef.current,
        title: "Your Location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      markersRef.current.push(userMarker);
    }

    // Add shelter markers
    const bounds = new window.google.maps.LatLngBounds();
    if (coords) {
      bounds.extend({ lat: coords.lat, lng: coords.lon });
    }

    shelters.forEach((shelter, index) => {
      const iconColor = intent === "hospital" ? "#ef4444" : intent === "police" ? "#3b82f6" : "#10b981";
      
      const marker = new window.google.maps.Marker({
        position: { lat: shelter.location.lat, lng: shelter.location.lng },
        map: mapInstanceRef.current,
        title: shelter.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: iconColor,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        label: {
          text: String(index + 1),
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: "bold",
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700;">${shelter.name}</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">${shelter.address}</p>
            ${shelter.distance ? `<p style="margin: 0; font-size: 12px; color: #94a3b8;">Distance: ${shelter.distance.toFixed(2)} km</p>` : ""}
            ${shelter.rating ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #f59e0b;">⭐ ${shelter.rating}</p>` : ""}
            <button onclick="window.selectShelter(${index})" style="margin-top: 8px; padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Get Directions</button>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(mapInstanceRef.current, marker);
        handleSelectShelter(shelter);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: shelter.location.lat, lng: shelter.location.lng });
    });

    // Fit bounds to show all markers
    if (shelters.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
    }

    // Make selectShelter available globally for info window buttons
    window.selectShelter = (index) => {
      handleSelectShelter(shelters[index]);
    };
  };

  // Normalize recommendation to intent format
  const normalizeIntent = (recommendation) => {
    const normalized = recommendation.toLowerCase().replace("-", "").replace(" ", "").replace("_", "");
    if (normalized.includes("hospital") || normalized.includes("medical")) {
      return "hospital";
    } else if (normalized.includes("police") || normalized.includes("911")) {
      return "police";
    } else if (normalized.includes("safe") || normalized.includes("place") || normalized.includes("shelter")) {
      return "safeplace";
    }
    return "hospital";
  };

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
        },
        (error) => {
          console.log("Geolocation error:", error);
          setError("Location access required. Please enable GPS to find shelters.");
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
      );
    }
  }, []);

  // Find nearby shelters
  const findShelters = async (detectedIntent) => {
    if (!coords || !coords.lat || !coords.lon) {
      setError("Location not available. Please enable GPS and allow location access.");
      return;
    }

    setFindingShelters(true);
    setError("");
    setShelters([]);
    setSelectedShelter(null);
    setRouteData(null);
    setLoading(true);

    try {
      const url = `${API_BASE}/api/routes/find-shelters?lat=${coords.lat}&lon=${coords.lon}&intent=${detectedIntent}`;
      const res = await axios.get(url);
      
      if (res.data && res.data.shelters && res.data.shelters.length > 0) {
        setShelters(res.data.shelters);
        setIntent(detectedIntent);
      } else {
        setError("No shelters found nearby. Try expanding your search area or check your location.");
      }
    } catch (e) {
      console.error("Shelter search error:", e);
      setError(`Failed to find shelters: ${e.response?.data?.message || e.message}`);
    } finally {
      setFindingShelters(false);
      setLoading(false);
    }
  };

  // Get directions to selected shelter
  const handleSelectShelter = async (shelter) => {
    setSelectedShelter(shelter);
    setRouteData(null);
    
    // Draw route immediately using Google Maps DirectionsService
    if (mapInstanceRef.current && window.google && coords) {
      drawRouteForShelter(shelter);
    }
    
    // Also fetch route data for display
    try {
      const url = `${API_BASE}/api/routes?lat=${coords.lat}&lon=${coords.lon}&intent=${intent}&place_id=${shelter.place_id || ""}`;
      const res = await axios.get(url);
      
      if (res.data && res.data.route) {
        setRouteData(res.data);
      }
    } catch (e) {
      console.error("Route fetch error:", e);
      // Don't show error if map route drawing works
    }
  };

  const drawRouteForShelter = (shelter) => {
    if (!mapInstanceRef.current || !window.google || !shelter || !coords) return;

    // Clear existing route
    if (window.routePolyline) {
      window.routePolyline.setMap(null);
      window.routePolyline = null;
    }

    if (window.directionsRenderer) {
      window.directionsRenderer.setMap(null);
      window.directionsRenderer = null;
    }

    // Use DirectionsService for accurate route rendering
    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map: mapInstanceRef.current,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#3b82f6",
        strokeWeight: 4,
        strokeOpacity: 0.8,
      },
    });

    const request = {
      origin: { lat: coords.lat, lng: coords.lon },
      destination: { lat: shelter.location.lat, lng: shelter.location.lng },
      travelMode: window.google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(result);
        window.directionsRenderer = directionsRenderer;
      } else {
        console.error("Directions request failed:", status);
        // Fallback: draw straight line
        const path = [
          { lat: coords.lat, lng: coords.lon },
          { lat: shelter.location.lat, lng: shelter.location.lng }
        ];
        const polyline = new window.google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: "#3b82f6",
          strokeOpacity: 0.5,
          strokeWeight: 3,
          icons: [{
            icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
            offset: "50%",
            repeat: "100px"
          }]
        });
        polyline.setMap(mapInstanceRef.current);
        window.routePolyline = polyline;
      }
    });
  };

  // Voice Input with Voice Activity Detection
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      setRecording(true);
      setError("");

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let silenceStartTime = null;
      const SILENCE_THRESHOLD = 20;
      const SILENCE_DURATION = 1500;
      let lastSoundTime = Date.now();
      let isActive = true;
      
      const checkVoiceActivity = () => {
        if (!isActive || mediaRecorder.state !== "recording") return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        if (average > SILENCE_THRESHOLD) {
          lastSoundTime = Date.now();
          silenceStartTime = null;
        } else {
          if (silenceStartTime === null) {
            silenceStartTime = Date.now();
          }
          
          const silenceDuration = Date.now() - silenceStartTime;
          if (silenceDuration >= SILENCE_DURATION && Date.now() - lastSoundTime >= SILENCE_DURATION) {
            isActive = false;
            if (mediaRecorder.state === "recording") {
              mediaRecorder.stop();
            }
            audioContext.close();
            return;
          }
        }
        
        if (isActive) {
          requestAnimationFrame(checkVoiceActivity);
        }
      };

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        isActive = false;
        setRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        try {
          audioContext.close();
        } catch (e) {}

        if (chunks.length === 0) {
          setError("No audio recorded. Please try again.");
          return;
        }

        const blob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "input.webm");

        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/api/medai/process_audio`, {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }

          const data = await res.json();
          const recommendation = data.recommendation || "hospital";
          const detectedIntent = normalizeIntent(recommendation);
          
          setIntent(detectedIntent);
          await findShelters(detectedIntent);
        } catch (err) {
          console.error("Error processing audio:", err);
          setError("Failed to process audio. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      mediaRecorder.start();
      checkVoiceActivity();
      
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          audioContext.close();
        }
      }, 30000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Microphone access denied. Please enable microphone permissions.");
      setRecording(false);
    }
  };

  // Text Input
  const handleTextSubmit = async () => {
    if (!text.trim()) {
      setError("Please enter a description of your situation.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/medai/process_text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const recommendation = data.recommendation || "hospital";
      const detectedIntent = normalizeIntent(recommendation);
      
      setIntent(detectedIntent);
      await findShelters(detectedIntent);
    } catch (err) {
      console.error("Error processing text:", err);
      setError("Failed to process request. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setShelters([]);
    setSelectedShelter(null);
    setRouteData(null);
    setIntent(null);
    setText("");
    setError("");
    setFindingShelters(false);
    
    // Clear route from map
    if (window.routePolyline) {
      window.routePolyline.setMap(null);
      window.routePolyline = null;
    }
  };

  const getIntentLabel = () => {
    if (intent === "hospital") return "Hospitals";
    if (intent === "police") return "Police Stations";
    return "Safe Places";
  };

  // Show results if shelters found
  if (shelters.length > 0) {
    return (
      <div className="findShelter">
        {intent === "police" && (
          <div className="findShelter__emergencyAlert">
            <div className="findShelter__emergencyContent">
              <strong>Emergency?</strong> Call <a href="tel:911" className="findShelter__emergencyLink">911</a> immediately for life-threatening situations
            </div>
          </div>
        )}

        <div className="findShelter__actions">
          <button onClick={handleStartOver} className="findShelter__backBtn">
            New Search
          </button>
        </div>

        <div className="findShelter__grid">
          {/* Map */}
          <div className="findShelter__card findShelter__card--map">
            <h3 className="findShelter__cardTitle">Nearby {getIntentLabel()}</h3>
            <div className="findShelter__map" ref={mapRef} style={{ height: "500px", width: "100%" }} />
          </div>

          {/* Shelter List */}
          <div className="findShelter__card">
            <h3 className="findShelter__cardTitle">Found {shelters.length} {getIntentLabel()}</h3>
            <div className="findShelter__shelterList">
              {shelters.map((shelter, index) => (
                <div
                  key={shelter.place_id || index}
                  className={`findShelter__shelterItem ${selectedShelter?.place_id === shelter.place_id ? "findShelter__shelterItem--selected" : ""}`}
                  onClick={() => handleSelectShelter(shelter)}
                >
                  <div className="findShelter__shelterNumber">{index + 1}</div>
                  <div className="findShelter__shelterInfo">
                    <div className="findShelter__shelterName">{shelter.name}</div>
                    <div className="findShelter__shelterAddress">{shelter.address}</div>
                    <div className="findShelter__shelterMeta">
                      {shelter.distance && (
                        <span className="findShelter__shelterDistance">
                          📍 {shelter.distance.toFixed(2)} km away
                        </span>
                      )}
                      {shelter.rating && (
                        <span className="findShelter__shelterRating">
                          ⭐ {shelter.rating}
                        </span>
                      )}
                    </div>
                  </div>
                  {routeData && selectedShelter?.place_id === shelter.place_id && (
                    <div className="findShelter__routeSummary">
                      <div className="findShelter__routeItem">
                        <span>Distance:</span>
                        <strong>{routeData.route?.distance || "—"}</strong>
                      </div>
                      <div className="findShelter__routeItem">
                        <span>Time:</span>
                        <strong>{routeData.route?.eta || "—"}</strong>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Route Details */}
        {routeData && selectedShelter && (
          <div className="findShelter__card">
            <h3 className="findShelter__cardTitle">Directions to {selectedShelter.name}</h3>
            {routeData.route?.map_url && (
              <div style={{ marginBottom: "16px", textAlign: "center" }}>
                <a
                  href={routeData.route.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="findShelter__directionsLink"
                >
                  Open in Google Maps →
                </a>
              </div>
            )}
            {routeData.route?.steps && routeData.route.steps.length > 0 && (
              <div className="findShelter__steps">
                {routeData.route.steps.slice(0, 10).map((step, index) => (
                  <div key={index} className="findShelter__step">
                    <div className="findShelter__stepNumber">{index + 1}</div>
                    <div className="findShelter__stepContent">
                      <div
                        className="findShelter__stepInstruction"
                        dangerouslySetInnerHTML={{ __html: step.instruction }}
                      />
                      <div className="findShelter__stepDetails">
                        {step.distance} • {step.duration}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <div className="findShelter__error">{error}</div>}
      </div>
    );
  }

  // Show loading state
  if (findingShelters || loading) {
    return (
      <div className="findShelter">
        <div className="findShelter__loading">
          <div className="spinner"></div>
          <span>Finding nearby shelters...</span>
        </div>
      </div>
    );
  }

  // Show input form
  return (
    <div className="findShelter">
      <div className="findShelter__inputSection">
        <div className="findShelter__inputCard">
          <h3 className="findShelter__inputTitle">Find Nearest Shelter</h3>
          <p className="findShelter__inputDescription">
            Describe your situation or use voice input. We'll find the nearest appropriate location and show you multiple options on the map.
          </p>
          
          <div className="findShelter__inputGroup">
            <textarea
              className="findShelter__textarea"
              rows={4}
              placeholder="Example: I am bleeding and need medical help, or I need police assistance, or I need a safe place to stay"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
            <div className="findShelter__inputActions">
              <button
                onClick={startRecording}
                disabled={recording || loading}
                className={`findShelter__voiceBtn ${recording ? "findShelter__voiceBtn--active" : ""}`}
              >
                {recording ? "🎤 Recording..." : "🎤 Voice Input"}
              </button>
              <button
                onClick={handleTextSubmit}
                disabled={loading || !text.trim()}
                className="findShelter__submitBtn"
              >
                {loading ? "Searching..." : "Find Shelters"}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="findShelter__quickActions">
          <button
            onClick={() => {
              setText("I need medical help");
              handleTextSubmit();
            }}
            disabled={loading}
            className="findShelter__quickBtn findShelter__quickBtn--medical"
          >
            🏥 Medical Help
          </button>
          <button
            onClick={() => {
              setText("I need police assistance");
              handleTextSubmit();
            }}
            disabled={loading}
            className="findShelter__quickBtn findShelter__quickBtn--police"
          >
            🚔 Police Assistance
          </button>
          <button
            onClick={() => {
              setText("I need a safe place to stay");
              handleTextSubmit();
            }}
            disabled={loading}
            className="findShelter__quickBtn findShelter__quickBtn--shelter"
          >
            🏠 Safe Place
          </button>
        </div>

        {/* Location Status */}
        {coords ? (
          <div className="findShelter__status findShelter__status--success">
            ✅ Location detected: {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
          </div>
        ) : (
          <div className="findShelter__status findShelter__status--warning">
            ⚠️ Location access needed to find nearby shelters
          </div>
        )}
      </div>

      {error && <div className="findShelter__error">{error}</div>}
    </div>
  );
}
