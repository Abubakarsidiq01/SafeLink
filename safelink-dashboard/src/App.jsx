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
import FindShelter from "./pages/FindShelter";
import Donate from "./pages/Donate";
import Settings from "./pages/Settings";
import DisasterManagement from "./pages/DisasterManagement";
import LocationUpdates from "./pages/LocationUpdates";
import RequestHelpModal from "./components/dashboard/RequestHelpModal";
import StatusUpdateModal from "./components/dashboard/StatusUpdateModal";
import SOSButton from "./components/emergency/SOSButton";
import NotificationToast from "./components/common/NotificationToast";
import useNotifications from "./hooks/useNotifications";
import "./App.css";

function AppContent() {
  const [showRequestHelpModal, setShowRequestHelpModal] = useState(false);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const { notifications, addNotification, removeNotification } = useNotifications();

  return (
    <div className="appShell">
      <Sidebar 
        onRequestHelp={() => setShowRequestHelpModal(true)}
        onStatusUpdate={() => setShowStatusUpdateModal(true)}
      />
      <main className="appMain">
        <TopBar />
        <div className="appMain__content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/nearby-devices" element={<NearbyDevices />} />
            <Route path="/rescues" element={<RescueLog />} />
            <Route path="/first-aid" element={<FirstAidGuide />} />
            <Route path="/relief-feed" element={<ReliefFeed />} />
            <Route path="/find-shelter" element={<FindShelter />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/disaster-management" element={<DisasterManagement />} />
            <Route path="/location-updates" element={<LocationUpdates />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>

      {showRequestHelpModal && (
        <RequestHelpModal
          onClose={() => setShowRequestHelpModal(false)}
          onSuccess={() => {
            setShowRequestHelpModal(false);
            addNotification("Help request submitted successfully! Volunteers will be notified.", "success");
          }}
        />
      )}

      {showStatusUpdateModal && (
        <StatusUpdateModal
          onClose={() => setShowStatusUpdateModal(false)}
          onSuccess={() => {
            setShowStatusUpdateModal(false);
            addNotification("Status update posted successfully!", "success");
          }}
        />
      )}

      <SOSButton
        onSuccess={() => {
          addNotification("Emergency SOS alert sent! Help is on the way.", "success");
        }}
      />

      {/* Notification Toasts */}
      <div className="notificationContainer">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
