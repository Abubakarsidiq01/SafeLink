// src/api/firstAidApi.js

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const API_BASE_WITH_PATH = `${API_BASE}/api`;

export async function getFirstAidInstructions(description, includeImages = true) {
  const res = await axios.post(`${API_BASE_WITH_PATH}/first-aid`, {
    description,
    includeImages,
  });
  return res.data.instructions;
}

