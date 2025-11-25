// src/api/rescueApi.js

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const API_BASE_WITH_PATH = `${API_BASE}/api`;

export async function fetchRescueStats() {
  const res = await axios.get(`${API_BASE_WITH_PATH}/rescues/stats`);
  return res.data;
}

export async function fetchRescues() {
  const res = await axios.get(`${API_BASE_WITH_PATH}/rescues`);
  // API returns: { success: true, count: X, rescues: [...] }
  // Return the rescues array directly
  return res.data.rescues || [];
}

