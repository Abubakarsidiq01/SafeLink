// src/components/common/NotificationToast.jsx

import React, { useEffect } from "react";
import "./NotificationToast.css";

export default function NotificationToast({ message, type = "info", onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`notificationToast notificationToast--${type}`}>
      <div className="notificationToast__content">
        <span className="notificationToast__message">{message}</span>
        {onClose && (
          <button className="notificationToast__close" onClick={onClose}>
            ×
          </button>
        )}
      </div>
    </div>
  );
}

