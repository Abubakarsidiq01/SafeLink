// src/pages/NearbyDevices.jsx

import React, { useEffect, useState } from "react";
import { fetchPeers, sendDirectMessage } from "../api/peerApi";
import SendMessageModal from "../components/devices/SendMessageModal";
import "./NearbyDevices.css";

export default function NearbyDevices() {
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const loadPeers = async () => {
    try {
      setError(null);
      const data = await fetchPeers(true); // Get active peers only
      setPeers(data || []);
    } catch (err) {
      console.error("Error loading peers:", err);
      setError("Failed to load nearby devices. Make sure the server is running.");
      // For demo purposes, show some mock peers
      setPeers([
        {
          id: "peer-demo-1",
          name: "Device Alpha",
          signalStrength: -45,
          distance: 0.5,
          lastSeen: new Date().toISOString(),
          capabilities: ["messaging", "relay"],
        },
        {
          id: "peer-demo-2",
          name: "Device Beta",
          signalStrength: -67,
          distance: 1.2,
          lastSeen: new Date().toISOString(),
          capabilities: ["messaging"],
        },
        {
          id: "peer-demo-3",
          name: "Device Gamma",
          signalStrength: -82,
          distance: 2.5,
          lastSeen: new Date().toISOString(),
          capabilities: ["messaging", "relay"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeers();
    const interval = setInterval(loadPeers, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (peer) => {
    setSelectedPeer(peer);
    setShowMessageModal(true);
  };

  const handleMessageSent = () => {
    setShowMessageModal(false);
    setSelectedPeer(null);
    // Optionally show success message
  };

  const getSignalStrengthLabel = (strength) => {
    if (strength >= -50) return { label: "Excellent", color: "#10b981" };
    if (strength >= -60) return { label: "Good", color: "#3b82f6" };
    if (strength >= -70) return { label: "Fair", color: "#f59e0b" };
    return { label: "Weak", color: "#ef4444" };
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    
    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} min ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="nearbyDevices">
        <div className="nearbyDevices__loading">
          <span className="spinner" /> Loading nearby devices...
        </div>
      </div>
    );
  }

  return (
    <div className="nearbyDevices">
      <div className="nearbyDevices__actions">
        <button
          className="nearbyDevices__refreshBtn"
          onClick={loadPeers}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="nearbyDevices__error">
          <p>{error}</p>
          <button onClick={loadPeers}>Retry</button>
        </div>
      )}

      {peers.length === 0 ? (
        <div className="nearbyDevices__empty">
          <div className="nearbyDevices__emptyIcon">📡</div>
          <h2>No devices found</h2>
          <p>No nearby devices are currently available in your mesh network.</p>
          <p className="nearbyDevices__emptyHint">
            Make sure your device's mesh networking is enabled and other devices are within range.
          </p>
        </div>
      ) : (
        <div className="nearbyDevices__grid">
          {peers.map((peer) => {
            const signal = getSignalStrengthLabel(peer.signalStrength || -70);
            return (
              <div key={peer.id} className="deviceCard">
                <div className="deviceCard__header">
                  <div className="deviceCard__icon">📱</div>
                  <div className="deviceCard__info">
                    <h3 className="deviceCard__name">{peer.name || peer.id}</h3>
                    <p className="deviceCard__id">{peer.id}</p>
                  </div>
                </div>

                <div className="deviceCard__details">
                  <div className="deviceCard__detail">
                    <span className="deviceCard__detailLabel">Signal:</span>
                    <span
                      className="deviceCard__detailValue"
                      style={{ color: signal.color }}
                    >
                      {signal.label} ({peer.signalStrength || "N/A"} dBm)
                    </span>
                  </div>

                  {peer.distance != null && (
                    <div className="deviceCard__detail">
                      <span className="deviceCard__detailLabel">Distance:</span>
                      <span className="deviceCard__detailValue">
                        {peer.distance.toFixed(1)} km
                      </span>
                    </div>
                  )}

                  <div className="deviceCard__detail">
                    <span className="deviceCard__detailLabel">Last seen:</span>
                    <span className="deviceCard__detailValue">
                      {formatLastSeen(peer.lastSeen)}
                    </span>
                  </div>

                  {peer.capabilities && peer.capabilities.length > 0 && (
                    <div className="deviceCard__capabilities">
                      {peer.capabilities.map((cap) => (
                        <span key={cap} className="deviceCard__capability">
                          {cap}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="deviceCard__actions">
                  <button
                    className="deviceCard__messageBtn"
                    onClick={() => handleSendMessage(peer)}
                  >
                    💬 Send Message
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showMessageModal && selectedPeer && (
        <SendMessageModal
          peer={selectedPeer}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedPeer(null);
          }}
          onSuccess={handleMessageSent}
        />
      )}
    </div>
  );
}

