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
  const recognitionRef = useRef(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  useEffect(() => {
    // Check if speech recognition is supported
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

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(coords);
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
            );
            const data = await response.json();
            const addr = data.address
              ? `${data.address.road || ""} ${data.address.house_number || ""}, ${data.address.city || data.address.town || data.address.village || ""}`.trim()
              : `${coords.latitude}, ${coords.longitude}`;
            setAddress(addr);
          } catch (err) {
            console.error("Reverse geocoding error:", err);
            setAddress(`${coords.latitude}, ${coords.longitude}`);
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          setLocationError("Could not get your location. Please enable location services.");
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanMessage = message.replace(/\[Listening\.\.\.\]/g, "").trim();
    
    if (!cleanMessage) {
      setError("Please enter a status update.");
      return;
    }

    if (!location) {
      setError("Location is required. Please enable location services.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createHelpRequest({
        message: cleanMessage,
        latitude: location.latitude,
        longitude: location.longitude,
        address: address,
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
    }
  };

  return (
    <div className="modalOverlay requestHelpModalOverlay" onClick={onClose}>
      <div className="modal requestHelpModal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Status Update</h2>
          <button onClick={onClose} className="modal__close" aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal__section">
            <label className="modal__label">
              Status Update
              <div className="modal__inputGroup">
                <textarea
                  className={`modal__textarea ${isListening ? "modal__textarea--listening" : ""}`}
                  placeholder="Share your current status, situation, or any updates..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  disabled={loading || isListening}
                  required
                />
                {isSpeechSupported && (
                  <button
                    type="button"
                    className={`modal__voiceButton ${isListening ? "modal__voiceButton--active" : ""}`}
                    onClick={toggleListening}
                    disabled={loading}
                    title={isListening ? "Stop recording" : "Start voice input"}
                  >
                    {isListening ? "⏹️ Stop" : "🎤 Voice"}
                  </button>
                )}
              </div>
              {isListening && (
                <div className="modal__listeningIndicator">
                  <span className="modal__listeningDot"></span>
                  Listening... Speak clearly.
                </div>
              )}
              {speechError && (
                <div className="modal__error">{speechError}</div>
              )}
            </label>
          </div>

          <div className="modal__section">
            <label className="modal__label">
              Location
              <input
                type="text"
                className="modal__input"
                value={address || "Getting location..."}
                disabled
                readOnly
              />
              {locationError && (
                <div className="modal__error">{locationError}</div>
              )}
              {!locationError && location && (
                <div className="modal__hint">Location automatically detected</div>
              )}
            </label>
          </div>

          {error && (
            <div className="modal__error">
              {error}
            </div>
          )}

          <div className="modal__actions">
            <button
              type="button"
              onClick={onClose}
              className="modal__cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal__submit"
              disabled={loading || !message.trim() || !location}
            >
              {loading ? "Submitting..." : "Post Status Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

