// src/pages/Settings.jsx

import React, { useState, useEffect } from "react";
import ConnectionStatus from "../components/common/ConnectionStatus";
import "./Settings.css";

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: true,
    locationSharing: true,
    darkMode: false,
    autoRefresh: true,
    refreshInterval: 10,
    emergencyContacts: [
      { name: "Emergency Services", number: "911", type: "emergency" },
      { name: "Police", number: "911", type: "police" },
      { name: "Fire Department", number: "911", type: "fire" },
      { name: "Medical Emergency", number: "911", type: "medical" },
    ],
  });

  useEffect(() => {
    const saved = localStorage.getItem("safelink-settings");
    if (saved) {
      try {
        setSettings({ ...settings, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Error loading settings:", e);
      }
    }
  }, []);

  const saveSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem("safelink-settings", JSON.stringify(updated));
  };

  const handleToggle = (key) => {
    saveSettings({ [key]: !settings[key] });
  };

  const handleAddContact = () => {
    const name = prompt("Contact name:");
    const number = prompt("Phone number:");
    if (name && number) {
      saveSettings({
        emergencyContacts: [
          ...settings.emergencyContacts,
          { name, number, type: "custom" },
        ],
      });
    }
  };

  const handleRemoveContact = (index) => {
    const updated = [...settings.emergencyContacts];
    updated.splice(index, 1);
    saveSettings({ emergencyContacts: updated });
  };

  const handleCall = (number) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="settings">
      <div className="settings__header">
        <h1 className="settings__title">Settings</h1>
        <p className="settings__subtitle">Manage your SafeLink preferences</p>
      </div>

      <div className="settings__grid">
        {/* Connection Status */}
        <div className="settings__card">
          <h2 className="settings__cardTitle">Connection Status</h2>
          <div className="settings__status">
            <ConnectionStatus />
          </div>
        </div>

        {/* Preferences */}
        <div className="settings__card">
          <h2 className="settings__cardTitle">Preferences</h2>
          <div className="settings__options">
            <div className="settings__option">
              <div className="settings__optionInfo">
                <label className="settings__optionLabel">Enable Notifications</label>
                <p className="settings__optionDesc">Receive alerts for new help requests</p>
              </div>
              <label className="settings__toggle">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={() => handleToggle("notifications")}
                />
                <span className="settings__toggleSlider" />
              </label>
            </div>

            <div className="settings__option">
              <div className="settings__optionInfo">
                <label className="settings__optionLabel">Location Sharing</label>
                <p className="settings__optionDesc">Allow automatic location detection</p>
              </div>
              <label className="settings__toggle">
                <input
                  type="checkbox"
                  checked={settings.locationSharing}
                  onChange={() => handleToggle("locationSharing")}
                />
                <span className="settings__toggleSlider" />
              </label>
            </div>

            <div className="settings__option">
              <div className="settings__optionInfo">
                <label className="settings__optionLabel">Dark Mode</label>
                <p className="settings__optionDesc">Switch to dark theme</p>
              </div>
              <label className="settings__toggle">
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={() => handleToggle("darkMode")}
                />
                <span className="settings__toggleSlider" />
              </label>
            </div>

            <div className="settings__option">
              <div className="settings__optionInfo">
                <label className="settings__optionLabel">Auto Refresh</label>
                <p className="settings__optionDesc">Automatically update dashboard data</p>
              </div>
              <label className="settings__toggle">
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={() => handleToggle("autoRefresh")}
                />
                <span className="settings__toggleSlider" />
              </label>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="settings__card settings__card--full">
          <div className="settings__cardHeader">
            <h2 className="settings__cardTitle">Emergency Contacts</h2>
            <button className="settings__addButton" onClick={handleAddContact}>
              + Add Contact
            </button>
          </div>
          <div className="settings__contacts">
            {settings.emergencyContacts.map((contact, index) => (
              <div key={index} className="settings__contact">
                <div className="settings__contactInfo">
                  <div className="settings__contactName">{contact.name}</div>
                  <div className="settings__contactNumber">{contact.number}</div>
                </div>
                <div className="settings__contactActions">
                  <button
                    className="settings__callButton"
                    onClick={() => handleCall(contact.number)}
                  >
                    📞 Call
                  </button>
                  {contact.type === "custom" && (
                    <button
                      className="settings__removeButton"
                      onClick={() => handleRemoveContact(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

