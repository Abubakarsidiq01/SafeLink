// src/components/emergency/SOSButton.jsx

import React, { useState } from "react";
import { createHelpRequest } from "../../api/helpRequestApi";
import "./SOSButton.css";

export default function SOSButton({ onSuccess }) {
  const [isActivating, setIsActivating] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const handleSOS = async () => {
    if (countdown !== null) {
      // Cancel if already counting down
      setCountdown(null);
      return;
    }

    // Start 3-second countdown
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    // After countdown, activate SOS
    setTimeout(async () => {
      clearInterval(countdownInterval);
      setIsActivating(true);
      
      try {
        // Get location
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });

        // Create emergency help request
        await createHelpRequest({
          message: "🚨 EMERGENCY SOS ALERT - Immediate assistance required!",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: "Emergency Location",
          status: "pending",
          priority: "Critical",
        });

        if (onSuccess) {
          onSuccess();
        }

        // Show success feedback
        setCountdown("✓");
        setTimeout(() => {
          setCountdown(null);
        }, 2000);
      } catch (error) {
        console.error("SOS activation error:", error);
        setCountdown("!");
        setTimeout(() => {
          setCountdown(null);
        }, 2000);
      } finally {
        setIsActivating(false);
      }
    }, 3000);
  };

  return (
    <button
      className={`sosButton ${countdown !== null ? "sosButton--active" : ""} ${isActivating ? "sosButton--activating" : ""}`}
      onClick={handleSOS}
      disabled={isActivating}
      aria-label="Emergency SOS Button"
    >
      <div className="sosButton__content">
        {countdown !== null && countdown !== "✓" && countdown !== "!" ? (
          <span className="sosButton__countdown">{countdown}</span>
        ) : countdown === "✓" ? (
          <span className="sosButton__check">✓</span>
        ) : countdown === "!" ? (
          <span className="sosButton__error">!</span>
        ) : (
          <>
            <span className="sosButton__text">SOS</span>
            <span className="sosButton__subtext">Emergency</span>
          </>
        )}
      </div>
      {countdown !== null && countdown !== "✓" && countdown !== "!" && (
        <div className="sosButton__pulse" />
      )}
    </button>
  );
}

