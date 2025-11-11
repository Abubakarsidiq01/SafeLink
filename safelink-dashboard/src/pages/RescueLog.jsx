// src/pages/RescueLog.jsx

import React, { useEffect, useState } from "react";
import { fetchRescues } from "../api/rescueApi";
import "./RescueLog.css";

export default function RescueLog() {
  const [rescues, setRescues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, accept, arrived

  const load = async () => {
    try {
      setError(null);
      const data = await fetchRescues();
      setRescues(data || []);
    } catch (err) {
      console.error("RescueLog error:", err);
      setError("Failed to load rescue log. Make sure the server is running on port 4000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 10_000); // refresh every 10s
    return () => clearInterval(id);
  }, []);

  const filteredRescues = rescues.filter((r) => {
    if (filter === "all") return true;
    return r.type === filter.toUpperCase();
  });

  const sortedRescues = [...filteredRescues].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  if (loading) {
    return (
      <div className="rescueLog">
        <div className="rescueLog__loading">
          <span className="spinner" /> Loading rescue log…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rescueLog">
        <div className="rescueLog__error">
          <p>{error}</p>
          <button onClick={load}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rescueLog">
      <div className="rescueLog__filters">
        <button
          className={`filterBtn ${filter === "all" ? "filterBtn--active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({rescues.length})
        </button>
        <button
          className={`filterBtn ${filter === "accept" ? "filterBtn--active" : ""}`}
          onClick={() => setFilter("accept")}
        >
          Accepted ({rescues.filter((r) => r.type === "ACCEPT").length})
        </button>
        <button
          className={`filterBtn ${filter === "arrived" ? "filterBtn--active" : ""}`}
          onClick={() => setFilter("arrived")}
        >
          Arrived ({rescues.filter((r) => r.type === "ARRIVED").length})
        </button>
      </div>

      <div className="rescueLog__table">
        {sortedRescues.length === 0 ? (
          <div className="rescueLog__empty">
            <p>No rescue events found.</p>
          </div>
        ) : (
          <table className="logTable">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event Type</th>
                <th>Alert ID</th>
                <th>Helper ID</th>
                <th>Distance</th>
                <th>ETA</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {sortedRescues.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.timestamp).toLocaleString()}</td>
                  <td>
                    <span className={`typeBadge typeBadge--${r.type.toLowerCase()}`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="logTable__id">{r.alertId || "—"}</td>
                  <td className="logTable__id">{r.helperId || "—"}</td>
                  <td>
                    {r.distanceKm ? `${r.distanceKm.toFixed(2)} km` : "—"}
                  </td>
                  <td>
                    {r.etaMinutes
                      ? `${r.etaMinutes} min`
                      : r.type === "ARRIVED"
                      ? "0 min"
                      : "—"}
                  </td>
                  <td className="logTable__location">
                    {r.latitude && r.longitude ? (
                      <span>
                        {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

