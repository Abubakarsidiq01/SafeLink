// src/api/firstAidApi.js

import axios from "axios";

const API_BASE = "http://localhost:4000/api";

export async function getFirstAidInstructions(description, includeImages = true) {
  const res = await axios.post(`${API_BASE}/first-aid`, {
    description,
    includeImages,
  });
  return res.data.instructions;
}

