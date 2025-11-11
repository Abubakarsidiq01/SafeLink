// src/components/dashboard/RequestHelpModal.jsx

import React, { useState, useEffect, useRef } from "react";
import { createHelpRequest } from "../../api/helpRequestApi";
import "./RequestHelpModal.css";

export default function RequestHelpModal({ onClose, onSuccess }) {
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
  const silenceTimeoutRef = useRef(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  useEffect(() => {
    // Get fresh location function
    const getLocation = async (showLoading = false) => {
      if (showLoading) setLocationError(null);
      
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          setLocationError("Geolocation is not supported by your browser.");
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
              setAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
            }
            
            resolve(coords);
          },
          (error) => {
            console.error("Geolocation error:", error);
            setLocationError("Could not get your location. Please enable location access.");
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

    // Get initial location
    getLocation(true);

    // Set up location watcher for real-time updates
    let locationWatchId = null;
    let lastLocation = null;
    
    if (navigator.geolocation) {
      locationWatchId = navigator.geolocation.watchPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          // Only update if location changed significantly (more than 10 meters)
          if (lastLocation) {
            const distance = Math.sqrt(
              Math.pow(coords.latitude - lastLocation.latitude, 2) +
              Math.pow(coords.longitude - lastLocation.longitude, 2)
            );
            // Skip update if change is less than ~0.0001 degrees (~11 meters)
            if (distance < 0.0001) return;
          }
          
          lastLocation = coords;
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

    // Store watch ID for cleanup
    const watchIdRef = { current: locationWatchId };

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

        // Reset silence timeout when speech is detected
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        
        // Auto-stop after 2 seconds of silence (no new results)
        silenceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }, 2000);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "no-speech") {
          // This is normal when user stops talking
          setSpeechError(null);
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
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setIsSpeechSupported(false);
    }

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      // Stop listening manually
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping recognition:", err);
      }
      setIsListening(false);
      setMessage((prev) => prev.replace(/\[Listening\.\.\.\]/g, "").trim());
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    } else {
      // Start listening
      setSpeechError(null);
      try {
        setMessage((prev) => prev.replace(/\[Listening\.\.\.\]/g, "").trim());
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error starting recognition:", err);
        setIsListening(false);
        if (err.message && err.message.includes("already started")) {
          setSpeechError("Speech recognition is already running.");
        } else {
          setSpeechError("Could not start speech recognition. Please check your microphone permissions.");
        }
      }
    }
  };

  const handleRefreshLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setIsGettingLocation(false);
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
          setAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError("Could not get your location. Please enable location access.");
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    // Get fresh location before submitting (with timeout)
    setIsGettingLocation(true);
    let freshLocation = location;
    
    if (navigator.geolocation) {
      try {
        const position = await Promise.race([
          new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000, // Reduced timeout
              maximumAge: 0,
            });
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Location timeout")), 5000)
          )
        ]);
        freshLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(freshLocation);
      } catch (err) {
        console.error("Error getting fresh location:", err);
        // Use existing location if available
        if (!freshLocation) {
          setError("Could not get location. Please enable location access and try again.");
          setIsGettingLocation(false);
          return;
        }
      }
    }
    
    setIsGettingLocation(false);
    
    // Clean message of any interim text
    const cleanMessage = message.replace(/\[Listening\.\.\.\]/g, "").trim();
    
    if (!cleanMessage) {
      setError("Please enter a message describing your help request.");
      return;
    }

    if (!freshLocation) {
      setError("Location is required. Please enable location access.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestData = {
        message: cleanMessage,
        latitude: freshLocation.latitude,
        longitude: freshLocation.longitude,
        address: address || "Location detected",
        status: "pending",
      };

      await createHelpRequest(requestData);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error("Error creating help request:", err);
      setError(err.response?.data?.message || "Failed to create help request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="requestHelpModalOverlay" onClick={onClose}>
      <div className="requestHelpModal" onClick={(e) => e.stopPropagation()}>
        <button className="requestHelpModal__close" onClick={onClose}>
          ×
        </button>

        <div className="requestHelpModal__header">
          <h2>Request Help</h2>
          <p className="requestHelpModal__subtitle">
            Describe what you need help with. Your location will be automatically detected.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="requestHelpModal__form">
          <div className="formGroup">
            <div className="formLabelRow">
              <label htmlFor="message" className="formLabel">
                What do you need help with? *
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
                      <span className="voiceButton__icon voiceButton__icon--stop">⏹️</span>
                      <span className="voiceButton__text">Stop</span>
                    </>
                  ) : (
                    <>
                      <span className="voiceButton__icon">🎤</span>
                      <span className="voiceButton__text">Voice</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <textarea
              id="message"
              className={`formTextarea ${isListening ? "formTextarea--listening" : ""}`}
              placeholder="E.g., I need medical assistance for an injured person at the community center. We have limited supplies and need urgent help."
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
                ? "Type your message or click the microphone button to use voice input. Be as descriptive as possible."
                : "Be as descriptive as possible. Include details like: type of help needed, number of people, urgency, etc."}
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
              <div className="formHint" style={{ marginTop: "8px", color: "#ef4444" }}>
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
            >
              {loading ? "Submitting..." : "Request Help"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

