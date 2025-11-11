// src/pages/FindShelter.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import "./FindShelter.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function FindShelter() {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [findingRoute, setFindingRoute] = useState(false);
  const [intent, setIntent] = useState(null);
  const [pendingIntent, setPendingIntent] = useState(null);

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
          setError("Location access required. Please enable GPS to find routes.");
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
      );
    }
  }, []);

  // Auto-fetch route when coords become available
  useEffect(() => {
    if (coords && pendingIntent && !routeData && !findingRoute) {
      const intentToFetch = pendingIntent;
      setPendingIntent(null);
      fetchRoute(intentToFetch);
    }
  }, [coords, pendingIntent, routeData, findingRoute]);

  // Fetch route from main API
  const fetchRoute = async (detectedIntent) => {
    if (!coords || !coords.lat || !coords.lon) {
      setError("Location not available. Please enable GPS and allow location access.");
      setFindingRoute(false);
      return;
    }

    setFindingRoute(true);
    setError("");
    setRouteData(null);
    setLoading(true);

    try {
      const url = `${API_BASE}/api/routes?lat=${coords.lat}&lon=${coords.lon}&intent=${detectedIntent}`;
      const res = await axios.get(url);
      setRouteData(res.data);
      setIntent(detectedIntent);
      setError("");
    } catch (e) {
      console.error("Route fetch error:", e);
      setError(`Failed to fetch route: ${e.response?.data?.message || e.message}`);
    } finally {
      setFindingRoute(false);
      setLoading(false);
    }
  };

  // Voice Input with Voice Activity Detection
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      setRecording(true);
      setError("");

      // Voice Activity Detection using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let silenceStartTime = null;
      const SILENCE_THRESHOLD = 20; // Adjust based on testing
      const SILENCE_DURATION = 1500; // Stop after 1.5 seconds of silence
      let lastSoundTime = Date.now();
      let isActive = true;
      
      const checkVoiceActivity = () => {
        if (!isActive || mediaRecorder.state !== "recording") return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        if (average > SILENCE_THRESHOLD) {
          // Sound detected
          lastSoundTime = Date.now();
          silenceStartTime = null;
        } else {
          // Silence detected
          if (silenceStartTime === null) {
            silenceStartTime = Date.now();
          }
          
          const silenceDuration = Date.now() - silenceStartTime;
          if (silenceDuration >= SILENCE_DURATION && Date.now() - lastSoundTime >= SILENCE_DURATION) {
            // Stop recording after silence
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
        } catch (e) {
          // Ignore if already closed
        }
        
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
          setLoading(false);

          if (coords && coords.lat && coords.lon) {
            await fetchRoute(detectedIntent);
          } else {
            setPendingIntent(detectedIntent);
            setError("Waiting for location access...");
          }
        } catch (err) {
          console.error("Error processing audio:", err);
          setError("Failed to process audio. Please try again.");
          setLoading(false);
        }
      };

      mediaRecorder.start();
      checkVoiceActivity();
      
      // Safety timeout - stop after 30 seconds max
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
      setLoading(false);

      if (coords && coords.lat && coords.lon) {
        await fetchRoute(detectedIntent);
      } else {
        setPendingIntent(detectedIntent);
        setError("Waiting for location access...");
      }
    } catch (err) {
      console.error("Error processing text:", err);
      setError("Failed to process request. Please check your connection and try again.");
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setRouteData(null);
    setIntent(null);
    setText("");
    setError("");
    setFindingRoute(false);
    setPendingIntent(null);
  };

  const getIntentLabel = () => {
    if (intent === "hospital") return "Hospital";
    if (intent === "police") return "Police Station";
    return "Safe Place";
  };

  // Show route results
  if (routeData) {
    const dest = routeData.destination;
    const route = routeData.route;

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
            <h3 className="findShelter__cardTitle">Route Map</h3>
            {routeData?.route?.map_url ? (
              <iframe
                title="Route Map"
                src={routeData.route.map_url}
                className="findShelter__map"
                loading="lazy"
                allowFullScreen
              />
            ) : (
              <div className="findShelter__mapPlaceholder">Loading map...</div>
            )}
          </div>

          {/* Destination Info */}
          <div className="findShelter__card">
            <h3 className="findShelter__cardTitle">Destination</h3>
            <div className="findShelter__destination">
              <div className="findShelter__destinationName">{dest?.name || "Unknown"}</div>
              <div className="findShelter__destinationAddress">{dest?.address || "Address not available"}</div>
              
              <div className="findShelter__routeInfo">
                <div className="findShelter__routeItem">
                  <div className="findShelter__routeLabel">Distance</div>
                  <div className="findShelter__routeValue">{route?.distance || "—"}</div>
                </div>
                <div className="findShelter__routeItem">
                  <div className="findShelter__routeLabel">Estimated Time</div>
                  <div className="findShelter__routeValue">{route?.eta || "—"}</div>
                </div>
                <div className="findShelter__routeItem">
                  <div className="findShelter__routeLabel">Distance (km)</div>
                  <div className="findShelter__routeValue">{route?.distance_km || "—"} km</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Route Steps - Only show if steps exist and are meaningful */}
        {route?.steps && route.steps.length > 0 && route.steps.length <= 10 && (
          <div className="findShelter__card">
            <h3 className="findShelter__cardTitle">Turn-by-Turn Directions</h3>
            <div className="findShelter__steps">
              {route.steps.slice(0, 8).map((step, index) => (
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
          </div>
        )}

        {error && <div className="findShelter__error">{error}</div>}
      </div>
    );
  }

  // Show loading state
  if (findingRoute || loading || (intent && !routeData && !error) || pendingIntent) {
    return (
      <div className="findShelter">
        <div className="findShelter__loading">
          <div className="spinner"></div>
            <span>Finding route...</span>
        </div>
      </div>
    );
  }

  // Show input form
  return (
    <div className="findShelter">
      <div className="findShelter__inputSection">
        <div className="findShelter__inputCard">
          <h3 className="findShelter__inputTitle">Describe Your Situation</h3>
          <p className="findShelter__inputDescription">
            Enter details about your emergency or situation. We'll find the nearest appropriate location and provide directions.
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
                {recording ? "Recording..." : "Voice Input"}
              </button>
              <button
                onClick={handleTextSubmit}
                disabled={loading || !text.trim()}
                className="findShelter__submitBtn"
              >
                {loading ? "Processing..." : "Find Location"}
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
            Medical Help
          </button>
          <button
            onClick={() => {
              setText("I need police assistance");
              handleTextSubmit();
            }}
            disabled={loading}
            className="findShelter__quickBtn findShelter__quickBtn--police"
          >
            Police Assistance
          </button>
          <button
            onClick={() => {
              setText("I need a safe place to stay");
              handleTextSubmit();
            }}
            disabled={loading}
            className="findShelter__quickBtn findShelter__quickBtn--shelter"
          >
            Safe Place
          </button>
        </div>

        {/* Location Status */}
        {coords ? (
          <div className="findShelter__status findShelter__status--success">
            Location detected
          </div>
        ) : (
          <div className="findShelter__status findShelter__status--warning">
            Location access needed for accurate routes
          </div>
        )}
      </div>

      {error && <div className="findShelter__error">{error}</div>}
    </div>
  );
}
