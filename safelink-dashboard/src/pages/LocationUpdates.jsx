// src/pages/LocationUpdates.jsx

import React, { useState, useEffect, lazy, Suspense } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./LocationUpdates.css";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

// Custom marker icons based on status
const getStatusIcon = (status) => {
  const colors = {
    safe: "#10b981",
    caution: "#f59e0b",
    danger: "#ef4444",
    evacuated: "#3b82f6",
  };

  return L.divIcon({
    className: "locationUpdateMarker",
    html: `<div style="
      width: 24px;
      height: 24px;
      background: ${colors[status] || colors.safe};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
};

function FitBounds({ locations }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, locations]);

  return null;
}

export default function LocationUpdates() {
  const [updates, setUpdates] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    status: "safe",
    message: "",
    address: "",
  });
  const [filter, setFilter] = useState("all"); // all, safe, caution, danger, evacuated

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
        }
      );
    }

    loadUpdates();
    const interval = setInterval(loadUpdates, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadUpdates = async () => {
    try {
      // This would fetch from your API
      // For now, using mock data
      const mockUpdates = [
        {
          id: 1,
          latitude: 37.7749,
          longitude: -122.4194,
          status: "safe",
          message: "Area is safe, no immediate threats",
          address: "Downtown Area",
          timestamp: new Date().toISOString(),
          reporter: "Community Member",
        },
        {
          id: 2,
          latitude: 37.7849,
          longitude: -122.4094,
          status: "caution",
          message: "Minor flooding reported, use caution",
          address: "Riverside District",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          reporter: "Local Volunteer",
        },
      ];
      setUpdates(mockUpdates);
    } catch (error) {
      console.error("Error loading updates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userLocation) {
      alert("Please enable location access");
      return;
    }

    try {
      const update = {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        status: formData.status,
        message: formData.message,
        address: formData.address || "Location detected",
        timestamp: new Date().toISOString(),
      };

      // Send to API
      const response = await fetch(`${API_BASE}/api/location-updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });

      if (response.ok) {
        setUpdates((prev) => [update, ...prev]);
        setFormData({ status: "safe", message: "", address: "" });
        setShowForm(false);
        alert("Location update posted successfully!");
      }
    } catch (error) {
      console.error("Error posting update:", error);
      alert("Failed to post location update");
    }
  };

  const filteredUpdates = updates.filter(
    (update) => filter === "all" || update.status === filter
  );

  const mapLocations = filteredUpdates.map((update) => ({
    lat: update.latitude,
    lng: update.longitude,
    ...update,
  }));

  if (userLocation) {
    mapLocations.push({ lat: userLocation.lat, lng: userLocation.lng, isUser: true });
  }

  const getStatusColor = (status) => {
    const colors = {
      safe: "#10b981",
      caution: "#f59e0b",
      danger: "#ef4444",
      evacuated: "#3b82f6",
    };
    return colors[status] || colors.safe;
  };

  const getStatusLabel = (status) => {
    const labels = {
      safe: "✅ Safe",
      caution: "⚠️ Caution",
      danger: "🚨 Danger",
      evacuated: "🏃 Evacuated",
    };
    return labels[status] || "Safe";
  };

  if (loading) {
    return (
      <div className="locationUpdates">
        <div className="locationUpdates__loading">
          <span className="spinner" /> Loading location updates...
        </div>
      </div>
    );
  }

  return (
    <div className="locationUpdates">
      <div className="locationUpdates__header">
        <div>
          <h1 className="locationUpdates__title">Location Updates</h1>
          <p className="locationUpdates__subtitle">
            Share and view real-time status updates from your community
          </p>
        </div>
        <button
          className="locationUpdates__postBtn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Post Update"}
        </button>
      </div>

      {showForm && (
        <div className="locationUpdates__formCard">
          <h2 className="locationUpdates__formTitle">Post Location Update</h2>
          <form onSubmit={handleSubmit} className="locationUpdates__form">
            <label className="locationUpdates__label">
              Status
              <select
                className="locationUpdates__select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="safe">✅ Safe</option>
                <option value="caution">⚠️ Caution</option>
                <option value="danger">🚨 Danger</option>
                <option value="evacuated">🏃 Evacuated</option>
              </select>
            </label>
            <label className="locationUpdates__label">
              Message
              <textarea
                className="locationUpdates__textarea"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe the current situation at your location..."
                rows={4}
                required
              />
            </label>
            {userLocation ? (
              <div className="locationUpdates__locationInfo">
                <span>📍 Location: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}</span>
              </div>
            ) : (
              <div className="locationUpdates__locationWarning">
                ⚠️ Location access required to post updates
              </div>
            )}
            <button
              type="submit"
              className="locationUpdates__submitBtn"
              disabled={!userLocation}
            >
              Post Update
            </button>
          </form>
        </div>
      )}

      <div className="locationUpdates__filters">
        <button
          className={`locationUpdates__filterBtn ${filter === "all" ? "locationUpdates__filterBtn--active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({updates.length})
        </button>
        <button
          className={`locationUpdates__filterBtn ${filter === "safe" ? "locationUpdates__filterBtn--active" : ""}`}
          onClick={() => setFilter("safe")}
        >
          ✅ Safe ({updates.filter((u) => u.status === "safe").length})
        </button>
        <button
          className={`locationUpdates__filterBtn ${filter === "caution" ? "locationUpdates__filterBtn--active" : ""}`}
          onClick={() => setFilter("caution")}
        >
          ⚠️ Caution ({updates.filter((u) => u.status === "caution").length})
        </button>
        <button
          className={`locationUpdates__filterBtn ${filter === "danger" ? "locationUpdates__filterBtn--active" : ""}`}
          onClick={() => setFilter("danger")}
        >
          🚨 Danger ({updates.filter((u) => u.status === "danger").length})
        </button>
        <button
          className={`locationUpdates__filterBtn ${filter === "evacuated" ? "locationUpdates__filterBtn--active" : ""}`}
          onClick={() => setFilter("evacuated")}
        >
          🏃 Evacuated ({updates.filter((u) => u.status === "evacuated").length})
        </button>
      </div>

      <div className="locationUpdates__grid">
        <div className="locationUpdates__mapContainer">
          {userLocation && mapLocations.length > 0 ? (
            <MapContainer
              center={[userLocation.lat, userLocation.lng]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <FitBounds locations={mapLocations} />
              {filteredUpdates.map((update) => (
                <Marker
                  key={update.id}
                  position={[update.latitude, update.longitude]}
                  icon={getStatusIcon(update.status)}
                >
                  <Popup>
                    <div className="locationUpdates__popup">
                      <strong style={{ color: getStatusColor(update.status) }}>
                        {getStatusLabel(update.status)}
                      </strong>
                      <p>{update.message}</p>
                      <p><small>{update.address}</small></p>
                      <p><small>{new Date(update.timestamp).toLocaleString()}</small></p>
                    </div>
                  </Popup>
                </Marker>
              ))}
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>
                  <strong>Your Location</strong>
                </Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="locationUpdates__mapPlaceholder">
              {!userLocation ? "Loading map..." : "No location updates to display"}
            </div>
          )}
        </div>

        <div className="locationUpdates__list">
          {filteredUpdates.length === 0 ? (
            <div className="locationUpdates__empty">
              <p>No location updates found.</p>
              <p>Be the first to post an update!</p>
            </div>
          ) : (
            filteredUpdates.map((update) => (
              <div
                key={update.id}
                className="locationUpdates__card"
                style={{ borderLeftColor: getStatusColor(update.status) }}
              >
                <div className="locationUpdates__cardHeader">
                  <span
                    className="locationUpdates__statusBadge"
                    style={{ backgroundColor: getStatusColor(update.status) }}
                  >
                    {getStatusLabel(update.status)}
                  </span>
                  <span className="locationUpdates__time">
                    {new Date(update.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="locationUpdates__message">{update.message}</p>
                <div className="locationUpdates__cardFooter">
                  <span className="locationUpdates__location">📍 {update.address}</span>
                  {update.reporter && (
                    <span className="locationUpdates__reporter">by {update.reporter}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

