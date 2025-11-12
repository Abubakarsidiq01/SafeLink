// src/pages/NearbyDevices.jsx

import React, { useEffect, useState } from "react";
import { fetchPeers, sendDirectMessage } from "../api/peerApi";
import SendMessageModal from "../components/devices/SendMessageModal";
import "./NearbyDevices.css";

export default function NearbyDevices() {
  const [peers, setPeers] = useState([]);
  const [filteredPeers, setFilteredPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("signal"); // signal, distance, name, lastSeen
  const [showDetails, setShowDetails] = useState({});

  const loadPeers = async () => {
    try {
      setError(null);
      setLoading(true);
      // Try to fetch both active and all peers to get comprehensive list
      const [activePeers, allPeers] = await Promise.all([
        fetchPeers(true).catch(() => []),
        fetchPeers(false).catch(() => [])
      ]);
      
      // Combine and deduplicate by ID
      const combined = [...activePeers, ...allPeers];
      const uniquePeers = Array.from(
        new Map(combined.map(peer => [peer.id || peer.peerId, peer])).values()
      );
      
      // Ensure all peers have required fields
      const normalizedPeers = uniquePeers.map(peer => ({
        id: peer.id || peer.peerId || `peer-${Math.random().toString(36).substr(2, 9)}`,
        name: peer.name || peer.deviceName || `Device ${peer.id || peer.peerId || 'Unknown'}`,
        signalStrength: peer.signalStrength || peer.rssi || -70,
        distance: peer.distance || peer.distanceKm || null,
        lastSeen: peer.lastSeen || peer.lastSeenAt || peer.updatedAt || new Date().toISOString(),
        capabilities: peer.capabilities || peer.features || ["messaging"],
        latitude: peer.latitude || peer.lat,
        longitude: peer.longitude || peer.lng,
      }));
      
      setPeers(normalizedPeers);
      
      if (normalizedPeers.length === 0) {
        setError("No nearby devices found. Make sure mesh networking is enabled and other devices are within range.");
      }
    } catch (err) {
      console.error("Error loading peers:", err);
      setError("Failed to load nearby devices. Make sure the server is running on port 4000.");
      setPeers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeers();
    const interval = setInterval(loadPeers, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter and sort peers
  useEffect(() => {
    let filtered = [...peers];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.id?.toLowerCase().includes(query) ||
          p.capabilities?.some((cap) => cap.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "signal":
          return (a.signalStrength || -100) - (b.signalStrength || -100);
        case "distance":
          return (a.distance || Infinity) - (b.distance || Infinity);
        case "name":
          return (a.name || a.id).localeCompare(b.name || b.id);
        case "lastSeen":
          return new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0);
        default:
          return 0;
      }
    });

    setFilteredPeers(filtered);
  }, [peers, searchQuery, sortBy]);

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
      <div className="nearbyDevices__header">
        <div className="nearbyDevices__stats">
          <div className="nearbyDevices__stat">
            <span className="nearbyDevices__statLabel">Total Devices</span>
            <span className="nearbyDevices__statValue">{peers.length}</span>
          </div>
          <div className="nearbyDevices__stat">
            <span className="nearbyDevices__statLabel">Active Now</span>
            <span className="nearbyDevices__statValue">
              {peers.filter((p) => {
                if (!p.lastSeen) return false;
                const lastSeen = new Date(p.lastSeen);
                const now = new Date();
                return (now - lastSeen) / 1000 < 300; // Active if seen in last 5 minutes
              }).length}
            </span>
          </div>
        </div>
        <div className="nearbyDevices__actions">
          <button
            className="nearbyDevices__refreshBtn"
            onClick={loadPeers}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="nearbyDevices__filters">
        <div className="nearbyDevices__search">
          <input
            type="text"
            placeholder="Search devices by name, ID, or capabilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="nearbyDevices__searchInput"
          />
        </div>
        <div className="nearbyDevices__sort">
          <label className="nearbyDevices__sortLabel">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="nearbyDevices__sortSelect"
          >
            <option value="signal">Signal Strength</option>
            <option value="distance">Distance</option>
            <option value="name">Name</option>
            <option value="lastSeen">Last Seen</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="nearbyDevices__error">
          <p>{error}</p>
          <button onClick={loadPeers}>Retry</button>
        </div>
      )}

      {filteredPeers.length === 0 ? (
        <div className="nearbyDevices__empty">
          <div className="nearbyDevices__emptyIcon">📡</div>
          <h2>
            {searchQuery ? "No devices match your search" : "No devices found"}
          </h2>
          <p>
            {searchQuery
              ? "Try adjusting your search query or filters."
              : "No nearby devices are currently available in your mesh network."}
          </p>
          {!searchQuery && (
            <p className="nearbyDevices__emptyHint">
              Make sure your device's mesh networking is enabled and other devices are within range.
            </p>
          )}
        </div>
      ) : (
        <div className="nearbyDevices__grid">
          {filteredPeers.map((peer) => {
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
                    className="deviceCard__detailsBtn"
                    onClick={() =>
                      setShowDetails((prev) => ({
                        ...prev,
                        [peer.id]: !prev[peer.id],
                      }))
                    }
                  >
                    {showDetails[peer.id] ? "▲ Hide" : "▼ Show"} Details
                  </button>
                  <button
                    className="deviceCard__messageBtn"
                    onClick={() => handleSendMessage(peer)}
                  >
                    💬 Send Message
                  </button>
                </div>
                {showDetails[peer.id] && (
                  <div className="deviceCard__expanded">
                    <div className="deviceCard__expandedSection">
                      <h4>Device Information</h4>
                      <div className="deviceCard__expandedRow">
                        <span>Device ID:</span>
                        <code>{peer.id}</code>
                      </div>
                      {peer.lastSeen && (
                        <div className="deviceCard__expandedRow">
                          <span>Last Seen:</span>
                          <span>{new Date(peer.lastSeen).toLocaleString()}</span>
                        </div>
                      )}
                      {peer.signalStrength && (
                        <div className="deviceCard__expandedRow">
                          <span>Signal (dBm):</span>
                          <span>{peer.signalStrength} dBm</span>
                        </div>
                      )}
                    </div>
                    {peer.capabilities && peer.capabilities.length > 0 && (
                      <div className="deviceCard__expandedSection">
                        <h4>Capabilities</h4>
                        <div className="deviceCard__capabilitiesList">
                          {peer.capabilities.map((cap) => (
                            <span key={cap} className="deviceCard__capabilityTag">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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

