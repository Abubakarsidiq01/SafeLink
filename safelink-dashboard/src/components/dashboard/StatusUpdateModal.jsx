// src/components/dashboard/StatusUpdateModal.jsx

import React, { useState, useEffect, useRef } from "react";
import { createHelpRequest } from "../../api/helpRequestApi";
import "./RequestHelpModal.css";

export default function StatusUpdateModal({ onClose, onSuccess }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [address, setAddress] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const recognitionRef = useRef(null);
  const locationWatchIdRef = useRef(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  // Get fresh location on mount and refresh before submit
  const getLocation = async (showLoading = false) => {
    if (showLoading) setIsGettingLocation(true);
    
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported by your browser.");
        setIsGettingLocation(false);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(coords);
          setLocationError(null);
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            
            if (data.address) {
              const addr = data.address;
              const addressParts = [
                addr.house_number,
                addr.road,
                addr.neighbourhood || addr.suburb,
                addr.city || addr.town,
                addr.state,
              ].filter(Boolean);
              setAddress(addressParts.join(", ") || "Location detected");
            } else {
              setAddress("Location detected");
            }
          } catch (err) {
            console.error("Reverse geocoding error:", err);
            setAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
          }
          
          setIsGettingLocation(false);
          resolve(coords);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setLocationError("Could not get your location. Please enable location access.");
          setIsGettingLocation(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0, // Always get fresh location
        }
      );
    });
  };

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        setMessage((prev) => {
          let baseMessage = prev.replace(/\[Listening\.\.\.\]/g, "").trim();
          if (finalTranscript) {
            baseMessage += (baseMessage ? " " : "") + finalTranscript.trim();
          }
          if (interimTranscript) {
            baseMessage += (baseMessage ? " " : "") + interimTranscript + " [Listening...]";
          }
          return baseMessage;
        });
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "no-speech") {
          setSpeechError("No speech detected. Please try again.");
        } else if (event.error === "audio-capture") {
          setSpeechError("No microphone found. Please check your microphone.");
        } else if (event.error === "not-allowed") {
          setSpeechError("Microphone permission denied. Please enable microphone access.");
        } else {
          setSpeechError("Speech recognition error. Please try typing instead.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setMessage((prev) => prev.replace(/\[Listening\.\.\.\]/g, "").trim());
      };

      recognitionRef.current = recognition;
    } else {
      setIsSpeechSupported(false);
    }

    // Get initial location
    getLocation(true);

    // Set up location watcher for real-time updates
    if (navigator.geolocation) {
      locationWatchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          // Only update if location changed significantly (more than 10 meters)
          if (location) {
            const distance = Math.sqrt(
              Math.pow(coords.latitude - location.latitude, 2) +
              Math.pow(coords.longitude - location.longitude, 2)
            );
            // Skip update if change is less than ~0.0001 degrees (~11 meters)
            if (distance < 0.0001) return;
          }
          
          setLocation(coords);
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            
            if (data.address) {
              const addr = data.address;
              const addressParts = [
                addr.house_number,
                addr.road,
                addr.neighbourhood || addr.suburb,
                addr.city || addr.town,
                addr.state,
              ].filter(Boolean);
              setAddress(addressParts.join(", ") || "Location detected");
            }
          } catch (err) {
            // Silently fail for watcher updates
            console.error("Reverse geocoding error:", err);
          }
        },
        (err) => {
          console.error("Geolocation watch error:", err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000, // Update every 5 seconds max
          timeout: 10000,
        }
      );
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (locationWatchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError("Speech recognition is not supported.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping recognition:", err);
      }
      setIsListening(false);
      setMessage((prev) => prev.replace(/\[Listening\.\.\.\]/g, "").trim());
    } else {
      setSpeechError(null);
      try {
        setMessage((prev) => prev.replace(/\[Listening\.\.\.\]/g, "").trim());
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error starting recognition:", err);
        setIsListening(false);
        setSpeechError("Could not start speech recognition.");
      }
    }
  };

  const handleRefreshLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    await getLocation(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Get fresh location before submitting
    const freshLocation = await getLocation(true);
    const locationToUse = freshLocation || location;
    
    const cleanMessage = message.replace(/\[Listening\.\.\.\]/g, "").trim();
    
    if (!cleanMessage) {
      setError("Please enter a status update.");
      return;
    }

    if (!locationToUse) {
      setError("Location is required. Please enable location services.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createHelpRequest({
        message: cleanMessage,
        latitude: locationToUse.latitude,
        longitude: locationToUse.longitude,
        address: address || "Location detected",
        type: "status_update",
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error creating status update:", err);
      setError(err.response?.data?.message || "Failed to submit status update. Please try again.");
    } finally {
      setLoading(false);
      setIsGettingLocation(false);
    }
  };

  return (
    <div className="requestHelpModalOverlay" onClick={onClose}>
      <div className="requestHelpModal" onClick={(e) => e.stopPropagation()}>
        <button className="requestHelpModal__close" onClick={onClose}>
          ×
        </button>

        <div className="requestHelpModal__header" style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}>
          <h2>Status Update</h2>
          <p className="requestHelpModal__subtitle">
            Share your current status or situation. Your location will be automatically detected and updated in real-time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="requestHelpModal__form">
          <div className="formGroup">
            <div className="formLabelRow">
              <label htmlFor="statusMessage" className="formLabel">
                Status Update *
              </label>
              {isSpeechSupported && (
                <button
                  type="button"
                  className={`voiceButton ${isListening ? "voiceButton--active" : ""}`}
                  onClick={toggleListening}
                  disabled={loading}
                  title={isListening ? "Stop recording" : "Start voice input"}
                >
                  {isListening ? (
                    <>
                      <span className="voiceButton__icon voiceButton__icon--stop"></span>
                      <span className="voiceButton__text">Stop</span>
                    </>
                  ) : (
                    <>
                      <span className="voiceButton__icon"></span>
                      <span className="voiceButton__text">Voice</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <textarea
              id="statusMessage"
              className={`formTextarea ${isListening ? "formTextarea--listening" : ""}`}
              placeholder="Share your current status, situation, or any updates... (e.g., 'All safe here, we have food and water for 20 people')"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              required
              disabled={loading || isListening}
            />
            {isListening && (
              <div className="listeningIndicator">
                <span className="listeningIndicator__dot"></span>
                Listening... Speak clearly into your microphone.
              </div>
            )}
            {speechError && (
              <div className="speechError">
                {speechError}
              </div>
            )}
            <div className="formHint">
              {isSpeechSupported 
                ? "Type your status update or click the microphone button to use voice input."
                : "Share your current status, situation, or any important updates with the network."}
            </div>
          </div>

          <div className="formGroup">
            <div className="formLabelRow">
              <label className="formLabel">Your Location</label>
              <button
                type="button"
                onClick={handleRefreshLocation}
                disabled={isGettingLocation || loading}
                className="voiceButton"
                style={{ fontSize: "12px", padding: "4px 10px" }}
                title="Refresh location"
              >
                {isGettingLocation ? "Updating..." : "Refresh"}
              </button>
            </div>
            {location ? (
              <div className="locationInfo">
                <div className="locationInfo__icon"></div>
                <div className="locationInfo__details">
                  <div className="locationInfo__address">{address || "Location detected"}</div>
                  <div className="locationInfo__coords">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </div>
                  {!isGettingLocation && (
                    <div style={{ fontSize: "11px", color: "#10b981", marginTop: "4px", fontWeight: "600" }}>
                      Location tracking active
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="locationError">
                {locationError || "Getting your location..."}
              </div>
            )}
            {isGettingLocation && (
              <div className="formHint" style={{ marginTop: "8px", color: "#3b82f6" }}>
                Getting fresh location...
              </div>
            )}
          </div>

          {error && (
            <div className="formError">
              {error}
            </div>
          )}

          <div className="requestHelpModal__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading || !location || !message.trim() || isGettingLocation}
              style={{ background: "#3b82f6" }}
            >
              {loading ? "Submitting..." : "Post Status Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
