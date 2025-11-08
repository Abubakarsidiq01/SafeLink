// src/App.jsx

import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import Dashboard from "./pages/Dashboard";
import NearbyDevices from "./pages/NearbyDevices";
import RescueLog from "./pages/RescueLog";
import FirstAidGuide from "./pages/FirstAidGuide";
import ReliefFeed from "./pages/ReliefFeed";
import RequestHelpModal from "./components/dashboard/RequestHelpModal";
import StatusUpdateModal from "./components/dashboard/StatusUpdateModal";
import "./App.css";

function AppContent() {
  const [showRequestHelpModal, setShowRequestHelpModal] = useState(false);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);

  return (
    <div className="appShell">
      <Sidebar 
        onRequestHelp={() => setShowRequestHelpModal(true)}
        onStatusUpdate={() => setShowStatusUpdateModal(true)}
      />
      <main className="appMain">
        <TopBar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/nearby-devices" element={<NearbyDevices />} />
          <Route path="/rescues" element={<RescueLog />} />
          <Route path="/first-aid" element={<FirstAidGuide />} />
          <Route path="/relief-feed" element={<ReliefFeed />} />
          <Route path="/settings" element={
            <div className="pagePlaceholder">
              <h2>Settings</h2>
              <p>Settings page coming soon...</p>
            </div>
          } />
        </Routes>
      </main>

      {showRequestHelpModal && (
        <RequestHelpModal
          onClose={() => setShowRequestHelpModal(false)}
          onSuccess={() => {
            setShowRequestHelpModal(false);
            window.location.reload(); // Refresh to show new request
          }}
        />
      )}

      {showStatusUpdateModal && (
        <StatusUpdateModal
          onClose={() => setShowStatusUpdateModal(false)}
          onSuccess={() => {
            setShowStatusUpdateModal(false);
            window.location.reload(); // Refresh to show new update
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
