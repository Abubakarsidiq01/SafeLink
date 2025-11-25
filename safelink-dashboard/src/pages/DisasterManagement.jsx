// src/pages/DisasterManagement.jsx

import React, { useState, useEffect } from "react";
import "./DisasterManagement.css";

// Direct import for better reliability
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function DisasterManagement() {
  const [activeTab, setActiveTab] = useState("pre"); // pre, during, post
  const [userLocation, setUserLocation] = useState(null);
  const [locationUpdates, setLocationUpdates] = useState([]);
  const [preparednessChecklist, setPreparednessChecklist] = useState({
    emergencyKit: false,
    evacuationPlan: false,
    emergencyContacts: false,
    documents: false,
    medications: false,
    water: false,
    food: false,
    firstAid: false,
  });
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [evacuationRoutes, setEvacuationRoutes] = useState([]);
  const [damageReports, setDamageReports] = useState([]);
  const [recoveryResources, setRecoveryResources] = useState([]);
  const [error, setError] = useState(null);

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
          setError("Unable to get your location. Please enable location access.");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }

    // Load location updates
    loadLocationUpdates();
  }, []);

  // Load weather alerts when location is available
  useEffect(() => {
    if (userLocation) {
      loadWeatherAlerts();
      // Refresh weather alerts every 30 minutes
      const interval = setInterval(() => {
        loadWeatherAlerts();
      }, 30 * 60 * 1000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  const loadLocationUpdates = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/location-updates`);
      if (response.ok) {
        const data = await response.json();
        setLocationUpdates(data || []);
      } else {
        console.error("Failed to load location updates");
        setLocationUpdates([]);
      }
    } catch (error) {
      console.error("Error loading location updates:", error);
      setLocationUpdates([]);
    }
  };

  const loadWeatherAlerts = async () => {
    if (!userLocation) return;

    try {
      setWeatherLoading(true);
      const response = await fetch(
        `${API_BASE}/api/weather/alerts?lat=${userLocation.lat}&lon=${userLocation.lng}`
      );

      if (response.ok) {
        const data = await response.json();
        setWeatherAlerts(data.alerts || []);
      } else {
        console.error("Failed to load weather alerts");
        setWeatherAlerts([]);
      }
    } catch (error) {
      console.error("Error loading weather alerts:", error);
      setWeatherAlerts([]);
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleChecklistChange = (item) => {
    setPreparednessChecklist((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const handleLocationUpdate = async (status, message) => {
    if (!userLocation) {
      alert("Please enable location access");
      return;
    }

    try {
      const update = {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        status,
        message,
        timestamp: new Date().toISOString(),
      };

      // Send to API
      const response = await fetch(`${API_BASE}/api/location-updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });

      if (response.ok) {
        setLocationUpdates((prev) => [update, ...prev]);
        alert("Location update posted successfully!");
      }
    } catch (error) {
      console.error("Error posting location update:", error);
      alert("Failed to post location update");
    }
  };

  const checklistProgress = Object.values(preparednessChecklist).filter(Boolean).length;
  const checklistTotal = Object.keys(preparednessChecklist).length;

  return (
    <div className="disasterManagement">
      <div className="disasterManagement__tabs">
        <button
          className={`disasterManagement__tab ${activeTab === "pre" ? "disasterManagement__tab--active" : ""}`}
          onClick={() => setActiveTab("pre")}
        >
          📋 Pre-Disaster
        </button>
        <button
          className={`disasterManagement__tab ${activeTab === "during" ? "disasterManagement__tab--active" : ""}`}
          onClick={() => setActiveTab("during")}
        >
          🚨 During Disaster
        </button>
        <button
          className={`disasterManagement__tab ${activeTab === "post" ? "disasterManagement__tab--active" : ""}`}
          onClick={() => setActiveTab("post")}
        >
          🔧 Post-Disaster
        </button>
      </div>

      {activeTab === "pre" && (
        <div className="disasterManagement__content">
          <div className="disasterManagement__section">
            <h2 className="disasterManagement__sectionTitle">Emergency Preparedness Checklist</h2>
            <div className="disasterManagement__progress">
              <div className="disasterManagement__progressBar">
                <div
                  className="disasterManagement__progressFill"
                  style={{ width: `${(checklistProgress / checklistTotal) * 100}%` }}
                />
              </div>
              <span className="disasterManagement__progressText">
                {checklistProgress} of {checklistTotal} items completed
              </span>
            </div>
            <div className="disasterManagement__checklist">
              {Object.entries(preparednessChecklist).map(([item, checked]) => (
                <label key={item} className="disasterManagement__checklistItem">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleChecklistChange(item)}
                  />
                  <span>{item.replace(/([A-Z])/g, " $1").trim()}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="disasterManagement__section">
            <div className="disasterManagement__sectionHeader">
              <h2 className="disasterManagement__sectionTitle">Weather Alerts</h2>
              {userLocation && (
                <button
                  className="disasterManagement__refreshBtn"
                  onClick={loadWeatherAlerts}
                  disabled={weatherLoading}
                >
                  {weatherLoading ? "🔄 Loading..." : "🔄 Refresh"}
                </button>
              )}
            </div>
            {!userLocation ? (
              <div className="disasterManagement__empty">
                <p>Location access required to load weather alerts.</p>
              </div>
            ) : weatherLoading ? (
              <div className="disasterManagement__empty">
                <p>Loading weather alerts...</p>
              </div>
            ) : weatherAlerts.length === 0 ? (
              <div className="disasterManagement__empty">
                <p>✅ No active weather alerts in your area.</p>
                <p style={{ fontSize: "14px", marginTop: "8px", color: "#94a3b8" }}>
                  All clear! Continue monitoring for updates.
                </p>
              </div>
            ) : (
              <div className="disasterManagement__alerts">
                {weatherAlerts.map((alert) => {
                  const severityColors = {
                    extreme: "#dc2626",
                    severe: "#ef4444",
                    moderate: "#f59e0b",
                    minor: "#3b82f6",
                  };
                  const severityIcons = {
                    extreme: "🚨",
                    severe: "⚠️",
                    moderate: "⚡",
                    minor: "ℹ️",
                  };
                  const severity = alert.severity?.toLowerCase() || "moderate";
                  const icon = severityIcons[severity] || "⚠️";
                  const color = severityColors[severity] || "#f59e0b";

                  return (
                    <div
                      key={alert.id}
                      className="disasterManagement__alert"
                      style={{ borderLeftColor: color }}
                    >
                      <div className="disasterManagement__alertIcon" style={{ fontSize: "24px" }}>
                        {icon}
                      </div>
                      <div className="disasterManagement__alertContent">
                        <div className="disasterManagement__alertHeader">
                          <h3>{alert.title}</h3>
                          <span
                            className="disasterManagement__alertSeverity"
                            style={{ backgroundColor: color }}
                          >
                            {severity.toUpperCase()}
                          </span>
                        </div>
                        <p>{alert.description}</p>
                        <div className="disasterManagement__alertMeta">
                          <span className="disasterManagement__alertTime">
                            {new Date(alert.startTime).toLocaleString()}
                          </span>
                          {alert.endTime && (
                            <span className="disasterManagement__alertEnd">
                              Until: {new Date(alert.endTime).toLocaleString()}
                            </span>
                          )}
                          {alert.source && (
                            <span className="disasterManagement__alertSource">
                              Source: {alert.source}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="disasterManagement__section">
            <h2 className="disasterManagement__sectionTitle">Evacuation Routes</h2>
            {userLocation ? (
              <div className="disasterManagement__mapContainer">
                <MapContainer
                  center={[userLocation.lat, userLocation.lng]}
                  zoom={13}
                  style={{ height: "400px", width: "100%" }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[userLocation.lat, userLocation.lng]}>
                    <Popup>Your Location</Popup>
                  </Marker>
                </MapContainer>
              </div>
            ) : (
              <div className="disasterManagement__mapPlaceholder">
                <p>Loading your location...</p>
                <p style={{ fontSize: "14px", color: "#64748b", marginTop: "8px" }}>
                  Please enable location access to view the map.
                </p>
              </div>
            )}
            <div className="disasterManagement__routes">
              <button className="disasterManagement__routeBtn">
                Find Nearest Evacuation Center
              </button>
              <button className="disasterManagement__routeBtn">
                Plan Evacuation Route
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "during" && (
        <div className="disasterManagement__content">
          <div className="disasterManagement__section">
            <h2 className="disasterManagement__sectionTitle">Real-Time Location Updates</h2>
            <div className="disasterManagement__updateForm">
              <select className="disasterManagement__statusSelect">
                <option value="safe">✅ Safe</option>
                <option value="caution">⚠️ Caution</option>
                <option value="danger">🚨 Danger</option>
                <option value="evacuated">🏃 Evacuated</option>
              </select>
              <textarea
                className="disasterManagement__updateInput"
                placeholder="Describe the current situation at your location..."
                rows={3}
              />
              <button
                className="disasterManagement__updateBtn"
                onClick={() => handleLocationUpdate("safe", "Test update")}
              >
                Post Location Update
              </button>
            </div>
          </div>

          <div className="disasterManagement__section">
            <h2 className="disasterManagement__sectionTitle">Community Updates Map</h2>
            {userLocation ? (
              <div className="disasterManagement__mapContainer">
                <MapContainer
                  center={[userLocation.lat, userLocation.lng]}
                  zoom={13}
                  style={{ height: "500px", width: "100%" }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[userLocation.lat, userLocation.lng]}>
                    <Popup>Your Location</Popup>
                  </Marker>
                  {locationUpdates.map((update) => (
                    <Marker
                      key={update.id}
                      position={[update.location?.lat || update.latitude, update.location?.lng || update.longitude]}
                    >
                      <Popup>
                        <strong>{update.status}</strong>
                        <br />
                        {update.message}
                        <br />
                        <small>{new Date(update.timestamp).toLocaleString()}</small>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            ) : (
              <div className="disasterManagement__mapPlaceholder">
                <p>Loading your location...</p>
                <p style={{ fontSize: "14px", color: "#64748b", marginTop: "8px" }}>
                  Please enable location access to view the map.
                </p>
              </div>
            )}
          </div>

          <div className="disasterManagement__section">
            <h2 className="disasterManagement__sectionTitle">Resource Requests</h2>
            <div className="disasterManagement__resources">
              <button className="disasterManagement__resourceBtn">
                Request Medical Supplies
              </button>
              <button className="disasterManagement__resourceBtn">
                Request Food & Water
              </button>
              <button className="disasterManagement__resourceBtn">
                Request Shelter
              </button>
              <button className="disasterManagement__resourceBtn">
                Request Transportation
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "post" && (
        <div className="disasterManagement__content">
          <div className="disasterManagement__section">
            <h2 className="disasterManagement__sectionTitle">Damage Assessment</h2>
            <div className="disasterManagement__damageForm">
              <label className="disasterManagement__label">
                Damage Level
                <select className="disasterManagement__select">
                  <option value="none">No Damage</option>
                  <option value="minor">Minor Damage</option>
                  <option value="moderate">Moderate Damage</option>
                  <option value="severe">Severe Damage</option>
                  <option value="destroyed">Destroyed</option>
                </select>
              </label>
              <label className="disasterManagement__label">
                Description
                <textarea
                  className="disasterManagement__textarea"
                  placeholder="Describe the damage..."
                  rows={4}
                />
              </label>
              <label className="disasterManagement__label">
                Photos (optional)
                <input type="file" accept="image/*" multiple className="disasterManagement__fileInput" />
              </label>
              <button className="disasterManagement__submitBtn">Submit Damage Report</button>
            </div>
          </div>

          <div className="disasterManagement__section">
            <h2 className="disasterManagement__sectionTitle">Recovery Resources</h2>
            <div className="disasterManagement__recoveryGrid">
              <div className="disasterManagement__recoveryCard">
                <h3>🏥 Medical Services</h3>
                <p>Find nearby medical facilities and clinics</p>
                <button className="disasterManagement__recoveryBtn">Find Help</button>
              </div>
              <div className="disasterManagement__recoveryCard">
                <h3>🏠 Housing Assistance</h3>
                <p>Temporary housing and shelter information</p>
                <button className="disasterManagement__recoveryBtn">Find Help</button>
              </div>
              <div className="disasterManagement__recoveryCard">
                <h3>💰 Financial Aid</h3>
                <p>Disaster relief funds and financial assistance</p>
                <button className="disasterManagement__recoveryBtn">Find Help</button>
              </div>
              <div className="disasterManagement__recoveryCard">
                <h3>🔧 Utilities</h3>
                <p>Report utility outages and get restoration updates</p>
                <button className="disasterManagement__recoveryBtn">Find Help</button>
              </div>
            </div>
          </div>

          <div className="disasterManagement__section">
            <h2 className="disasterManagement__sectionTitle">Community Support</h2>
            <div className="disasterManagement__support">
              <button className="disasterManagement__supportBtn">
                Volunteer to Help
              </button>
              <button className="disasterManagement__supportBtn">
                Donate Supplies
              </button>
              <button className="disasterManagement__supportBtn">
                Share Resources
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

