// src/api/rescueApi.js

import axios from "axios";

const API_BASE = "http://localhost:4000/api";

export async function fetchRescueStats() {
  const res = await axios.get(`${API_BASE}/rescues/stats`);
  return res.data;
}

export async function fetchRescues() {
  const res = await axios.get(`${API_BASE}/rescues`);
  // API returns: { success: true, count: X, rescues: [...] }
  // Return the rescues array directly
  return res.data.rescues || [];
}

