// src/pages/Donate.jsx

import React, { useState } from "react";
import { createGeneralDonation } from "../lib/firebase/firestoreApi";
import "./Donate.css";

export default function Donate() {
  const [amount, setAmount] = useState("");
  const [selectedQuickAmount, setSelectedQuickAmount] = useState(null);
  const [donorName, setDonorName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500, 1000];

  const handleQuickAmount = (value) => {
    setAmount(String(value));
    setSelectedQuickAmount(value);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const numericAmount = Number(amount);
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (numericAmount < 1) {
      setError("Minimum donation is $1");
      return;
    }

    setLoading(true);

    try {
      await createGeneralDonation({
        amount: numericAmount,
        donorName: donorName.trim() || "Anonymous",
        message: message.trim() || "",
      });

      setSuccess(true);
      setAmount("");
      setSelectedQuickAmount(null);
      setDonorName("");
      setMessage("");
      
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("Donation error:", err);
      setError(err.message || "Failed to process donation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donate">
      <div className="donate__container">
        <div className="donate__content">
          <div className="donate__card">
            <form onSubmit={handleSubmit} className="donate__form">
              <div className="donate__section">
                <label className="donate__label">
                  Donation Amount (USD) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className={`donate__input ${error ? "donate__input--error" : ""}`}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setSelectedQuickAmount(null);
                    setError(null);
                  }}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="donate__section">
                <p className="donate__sectionTitle">Quick Amounts</p>
                <div className="donate__quickAmounts">
                  {QUICK_AMOUNTS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`donate__quickAmountBtn ${
                        selectedQuickAmount === value ? "donate__quickAmountBtn--selected" : ""
                      }`}
                      onClick={() => handleQuickAmount(value)}
                      disabled={loading}
                    >
                      ${value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="donate__section">
                <label className="donate__label">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  className="donate__input"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Anonymous"
                  maxLength={50}
                />
              </div>

              <div className="donate__section">
                <label className="donate__label">
                  Message (Optional)
                </label>
                <textarea
                  className="donate__textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message to your donation..."
                  rows={4}
                  maxLength={500}
                />
                <div className="donate__charCount">
                  {message.length}/500
                </div>
              </div>

              {error && (
                <div className="donate__error">
                  {error}
                </div>
              )}

              {success && (
                <div className="donate__success">
                  Thank you for your donation! Your contribution makes a difference.
                </div>
              )}

              <button
                type="submit"
                className="donate__submitBtn"
                disabled={loading || !amount || Number(amount) < 1}
              >
                {loading ? "Processing..." : `Donate $${amount || "0"}`}
              </button>
            </form>
          </div>

          <div className="donate__info">
            <div className="donate__infoCard">
              <h3 className="donate__infoTitle">How Your Donation Helps</h3>
              <ul className="donate__infoList">
                <li>Supports emergency relief operations</li>
                <li>Provides medical supplies and equipment</li>
                <li>Helps with food and shelter distribution</li>
                <li>Supports rescue and evacuation efforts</li>
                <li>Funds communication infrastructure</li>
              </ul>
            </div>

            <div className="donate__infoCard">
              <h3 className="donate__infoTitle">Transparency</h3>
              <p className="donate__infoText">
                All donations are tracked and used directly for relief efforts. 
                Your contribution helps those in need during emergencies and disasters.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

