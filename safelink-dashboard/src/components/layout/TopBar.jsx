// src/components/layout/TopBar.jsx

import React from "react";
import { useLocation } from "react-router-dom";
import ConnectionStatus from "../common/ConnectionStatus";
import "./TopBar.css";

export default function TopBar() {
  const location = useLocation();

  const getTitle = () => {
    switch (location.pathname) {
      case "/nearby-devices":
        return "Nearby Devices";
      case "/rescues":
        return "Rescue Log";
      case "/first-aid":
        return "AI First Aid Guide";
      case "/relief-feed":
        return "Relief & Donation Feed";
      case "/find-shelter":
        return "Find Shelter";
      case "/donate":
        return "Donate Money";
      case "/disaster-management":
        return "Disaster Management";
      case "/location-updates":
        return "Location Updates";
      case "/settings":
        return "Settings";
      default:
        return "Rescue Operations";
    }
  };

  const getSubtitle = () => {
    switch (location.pathname) {
      case "/nearby-devices":
        return "Discover and connect with devices in your mesh network. Send direct messages to any device.";
      case "/rescues":
        return "Complete history of all rescue events and operations.";
      case "/first-aid":
        return "Get AI-powered first aid instructions based on your situation. Supports multiple languages with voice input.";
      case "/relief-feed":
        return "Browse and contribute to relief efforts in your area. Donate money, items, or upvote urgent requests.";
      case "/find-shelter":
        return "Find nearby shelters, hospitals, and safe places during emergencies. Get directions and route information.";
      case "/donate":
        return "Make a general donation to support relief efforts. Your contribution helps those in need across the network.";
      case "/disaster-management":
        return "Pre, during, and post-disaster management tools. Preparedness checklists, real-time updates, and recovery resources.";
      case "/location-updates":
        return "Share and view real-time location status updates from your community. See what's happening around you.";
      case "/settings":
        return "Configure your SafeLink Mesh AI dashboard.";
      default:
        return "Live overview of ongoing and completed rescues in your network.";
    }
  };

  return (
    <header className="topbar">
      <div>
        <h1 className="topbar__title">{getTitle()}</h1>
        <p className="topbar__subtitle">
          {getSubtitle()}
        </p>
      </div>
      <div className="topbar__right">
        <ConnectionStatus />
        <div className="topbar__pill">
          <span className="topbar__statusDot" />
          Live updating
        </div>
        <button className="topbar__btn">Export data</button>
      </div>
    </header>
  );
}
