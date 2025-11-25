// src/components/common/ConnectionStatus.jsx

import React, { useState, useEffect } from "react";
import "./ConnectionStatus.css";

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [serverStatus, setServerStatus] = useState("checking");

  useEffect(() => {
    const checkServer = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
        const response = await fetch(`${API_BASE}/health`, {
          method: "GET",
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          setServerStatus("online");
        } else {
          setServerStatus("offline");
        }
      } catch (error) {
        setServerStatus("offline");
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const status = isOnline && serverStatus === "online" ? "online" : "offline";
  const statusText = status === "online" ? "Online" : "Offline Mode";

  return (
    <div className={`connectionStatus connectionStatus--${status}`}>
      <div className="connectionStatus__indicator" />
      <span className="connectionStatus__text">{statusText}</span>
    </div>
  );
}

