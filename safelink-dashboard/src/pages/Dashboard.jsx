// src/pages/Dashboard.jsx

import React, { useEffect, useState } from "react";
import { fetchRescueStats, fetchRescues } from "../api/rescueApi";
import { fetchPendingRequests, fetchHelpRequests, fetchActiveRequests } from "../api/helpRequestApi";
import RescueStatsCards from "../components/dashboard/RescueStatsCards";
import RescueMap from "../components/dashboard/RescueMap";
import RescueTable from "../components/dashboard/RescueTable";
import RescueDetailModal from "../components/dashboard/RescueDetailModal";
import ActionRequiredSection from "../components/dashboard/ActionRequiredSection";
import "./Dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [rescues, setRescues] = useState([]);
  const [filteredRescues, setFilteredRescues] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRescue, setSelectedRescue] = useState(null);
  const [volunteerLocation, setVolunteerLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    try {
      setError(null);
      const [s, r, p, activeRequests] = await Promise.all([
        fetchRescueStats(),
        fetchRescues(),
        fetchPendingRequests().catch(() => []), // Fail gracefully if endpoint doesn't exist yet
        fetchActiveRequests().catch(() => []), // Get only active (non-fulfilled) help requests
      ]);
      setStats(s);
      
      // Combine rescue events with active help requests for the table
      // Only show requests that haven't been completed (status !== "fulfilled")
      // Convert help requests to rescue-like format for display
      const helpRequestRescues = (activeRequests || [])
        .filter(req => req.status !== "fulfilled" && req.status !== "cancelled")
        .map(req => ({
          id: req.id,
          type: "HELP_REQUEST",
          alertId: req.id,
          natureOfHelp: req.natureOfHelp,
          priority: req.priority || "Normal",
          message: req.message,
          latitude: req.latitude,
          longitude: req.longitude,
          address: req.address,
          timestamp: req.timestamp,
          status: req.status,
          distanceKm: null,
          etaMinutes: null,
          helperId: null,
        }));
      
      // Combine and sort by priority (Critical first), then timestamp
      const allRescues = [...(r || []), ...helpRequestRescues].sort((a, b) => {
        // Priority order: Critical > High > Normal
        const priorityOrder = { Critical: 3, High: 2, Normal: 1 };
        const aPriority = priorityOrder[a.priority] || 1;
        const bPriority = priorityOrder[b.priority] || 1;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }
        
        // Then sort by timestamp (newest first)
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      
      setRescues(allRescues);
      setFilteredRescues(allRescues);
      setPendingRequests(p || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load data. Make sure the server is running on port 4000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 10_000); // refresh every 10s
    return () => clearInterval(id);
  }, []);

  // Filter rescues based on search and filters
  useEffect(() => {
    let filtered = [...rescues];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.natureOfHelp?.toLowerCase().includes(query) ||
          r.message?.toLowerCase().includes(query) ||
          r.address?.toLowerCase().includes(query) ||
          r.type?.toLowerCase().includes(query)
      );
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((r) => r.priority === priorityFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    setFilteredRescues(filtered);
  }, [rescues, searchQuery, priorityFilter, statusFilter]);

  // Get volunteer's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setVolunteerLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
          // Default to San Francisco if location denied
          setVolunteerLocation({ lat: 37.7749, lng: -122.4194 });
        }
      );
    } else {
      // Default location
      setVolunteerLocation({ lat: 37.7749, lng: -122.4194 });
    }
  }, []);


  const handleRowClick = (rescue) => {
    setSelectedRescue(rescue);
  };

  const handleCloseModal = () => {
    setSelectedRescue(null);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">
          <span className="spinner" /> Loading rescue data…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard__error">
          <p>{error}</p>
          <button onClick={load}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {pendingRequests.length > 0 && (
        <ActionRequiredSection requests={pendingRequests} onRequestClick={handleRowClick} />
      )}

      <RescueStatsCards stats={stats} />
      
      {/* Search and Filters */}
      <div className="dashboard__filters">
        <div className="dashboard__search">
          <input
            type="text"
            placeholder="Search rescues, locations, or messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dashboard__searchInput"
          />
        </div>
        <div className="dashboard__filterGroup">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="dashboard__filter"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="dashboard__filter"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {(searchQuery || priorityFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setPriorityFilter("all");
                setStatusFilter("all");
              }}
              className="dashboard__clearFilters"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      <div className="dashboard__grid">
        <RescueMap rescues={filteredRescues} onMarkerClick={handleRowClick} />
        <RescueTable rescues={filteredRescues} onRowClick={handleRowClick} />
      </div>
      
      {selectedRescue && (
        <RescueDetailModal
          rescue={selectedRescue}
          onClose={handleCloseModal}
          volunteerLocation={volunteerLocation}
          onStatusUpdate={load}
        />
      )}
    </div>
  );
}

