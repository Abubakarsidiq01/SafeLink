// src/components/layout/Sidebar.jsx

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar({ onRequestHelp, onStatusUpdate }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <span className="sidebar__dot" />
        <span>SafeLink</span>
      </div>
      <nav className="sidebar__nav">
        <div className="sidebar__sectionTitle">Overview</div>
        <button
          className={`sidebar__item ${isActive("/") ? "sidebar__item--active" : ""}`}
          onClick={() => navigate("/")}
        >
          Dashboard
        </button>
        <button
          className={`sidebar__item ${isActive("/find-shelter") ? "sidebar__item--active" : ""}`}
          onClick={() => navigate("/find-shelter")}
        >
          Find Shelter
        </button>
        <button
          className={`sidebar__item ${isActive("/nearby-devices") ? "sidebar__item--active" : ""}`}
          onClick={() => navigate("/nearby-devices")}
        >
          Nearby Devices
        </button>
        <button
          className={`sidebar__item ${isActive("/rescues") ? "sidebar__item--active" : ""}`}
          onClick={() => navigate("/rescues")}
        >
          Rescue log
        </button>
        <button
          className={`sidebar__item ${isActive("/first-aid") ? "sidebar__item--active" : ""}`}
          onClick={() => navigate("/first-aid")}
        >
          First Aid Guide
        </button>
        <button
          className={`sidebar__item ${isActive("/relief-feed") ? "sidebar__item--active" : ""}`}
          onClick={() => navigate("/relief-feed")}
        >
          Relief/Donation Feed
        </button>
        <button
          className={`sidebar__item ${isActive("/donate") ? "sidebar__item--active" : ""}`}
          onClick={() => navigate("/donate")}
        >
          Donate Money
        </button>
        
        <div className="sidebar__sectionTitle" style={{ marginTop: "24px" }}>
          Disaster Management
        </div>
        <button
          className={`sidebar__item ${isActive("/disaster-management") ? "sidebar__item--active" : ""}`}
          onClick={() => navigate("/disaster-management")}
        >
          Disaster Management
        </button>
        <button
          className={`sidebar__item ${isActive("/location-updates") ? "sidebar__item--active" : ""}`}
          onClick={() => navigate("/location-updates")}
        >
          Location Updates
        </button>
        
        <div className="sidebar__sectionTitle" style={{ marginTop: "24px" }}>
          Actions
        </div>
        <button
          className="sidebar__item sidebar__item--action"
          onClick={onRequestHelp}
        >
          Request Help
        </button>
        <button
          className="sidebar__item sidebar__item--action"
          onClick={onStatusUpdate}
        >
          Status Update
        </button>
        
        <div className="sidebar__sectionTitle" style={{ marginTop: "24px" }}>
          Settings
        </div>
        <button
          className={`sidebar__item ${isActive("/settings") ? "sidebar__item--active" : ""}`}
          onClick={() => navigate("/settings")}
        >
          Settings
        </button>
      </nav>
      <div className="sidebar__footer">
        <div className="sidebar__badge">
          Mesh online
        </div>
        <small className="sidebar__footnote">
          Powered by SafeLink Mesh AI
        </small>
      </div>
    </aside>
  );
}

