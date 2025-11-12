// src/pages/RescueLog.jsx

import React, { useEffect, useState } from "react";
import { fetchRescues } from "../api/rescueApi";
import "./RescueLog.css";

export default function RescueLog() {
  const [rescues, setRescues] = useState([]);
  const [filteredRescues, setFilteredRescues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, accept, arrived
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("all"); // all, today, week, month
  const [stats, setStats] = useState({ total: 0, accepted: 0, arrived: 0 });

  const load = async () => {
    try {
      setError(null);
      const data = await fetchRescues();
      setRescues(data || []);
      
      // Calculate stats
      setStats({
        total: data?.length || 0,
        accepted: data?.filter((r) => r.type === "ACCEPT").length || 0,
        arrived: data?.filter((r) => r.type === "ARRIVED").length || 0,
      });
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

  useEffect(() => {
    let filtered = [...rescues];

    // Type filter
    if (filter !== "all") {
      filtered = filtered.filter((r) => r.type === filter.toUpperCase());
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.alertId?.toLowerCase().includes(query) ||
          r.helperId?.toLowerCase().includes(query) ||
          r.type?.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const cutoff = new Date();
      switch (dateRange) {
        case "today":
          cutoff.setHours(0, 0, 0, 0);
          break;
        case "week":
          cutoff.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }
      filtered = filtered.filter((r) => new Date(r.timestamp) >= cutoff);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setFilteredRescues(filtered);
  }, [rescues, filter, searchQuery, dateRange]);

  const handleExport = () => {
    const csv = [
      ["Time", "Event Type", "Alert ID", "Helper ID", "Distance", "ETA", "Location"].join(","),
      ...filteredRescues.map((r) =>
        [
          new Date(r.timestamp).toLocaleString(),
          r.type,
          r.alertId || "",
          r.helperId || "",
          r.distanceKm ? `${r.distanceKm} km` : "",
          r.etaMinutes ? `${r.etaMinutes} min` : "",
          r.latitude && r.longitude
            ? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`
            : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rescue-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
      <div className="rescueLog__header">
        <div className="rescueLog__stats">
          <div className="rescueLog__stat">
            <span className="rescueLog__statLabel">Total Events</span>
            <span className="rescueLog__statValue">{stats.total}</span>
          </div>
          <div className="rescueLog__stat">
            <span className="rescueLog__statLabel">Accepted</span>
            <span className="rescueLog__statValue">{stats.accepted}</span>
          </div>
          <div className="rescueLog__stat">
            <span className="rescueLog__statLabel">Arrived</span>
            <span className="rescueLog__statValue">{stats.arrived}</span>
          </div>
        </div>
        <button className="rescueLog__exportBtn" onClick={handleExport}>
          📥 Export CSV
        </button>
      </div>

      <div className="rescueLog__filters">
        <div className="rescueLog__filterGroup">
          <button
            className={`filterBtn ${filter === "all" ? "filterBtn--active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({stats.total})
          </button>
          <button
            className={`filterBtn ${filter === "accept" ? "filterBtn--active" : ""}`}
            onClick={() => setFilter("accept")}
          >
            Accepted ({stats.accepted})
          </button>
          <button
            className={`filterBtn ${filter === "arrived" ? "filterBtn--active" : ""}`}
            onClick={() => setFilter("arrived")}
          >
            Arrived ({stats.arrived})
          </button>
        </div>
        <div className="rescueLog__searchGroup">
          <input
            type="text"
            placeholder="Search by Alert ID, Helper ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rescueLog__searchInput"
          />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rescueLog__dateSelect"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="rescueLog__table">
        {filteredRescues.length === 0 ? (
          <div className="rescueLog__empty">
            <p>
              {searchQuery || dateRange !== "all"
                ? "No rescue events match your filters."
                : "No rescue events found."}
            </p>
            {(searchQuery || dateRange !== "all") && (
              <button
                className="rescueLog__clearFilters"
                onClick={() => {
                  setSearchQuery("");
                  setDateRange("all");
                  setFilter("all");
                }}
              >
                Clear Filters
              </button>
            )}
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
              {filteredRescues.map((r) => (
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

