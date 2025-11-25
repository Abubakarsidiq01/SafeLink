// src/api/peerApi.js

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const API_BASE_WITH_PATH = `${API_BASE}/api`;

export async function fetchPeers(activeOnly = false) {
  const url = activeOnly 
    ? `${API_BASE_WITH_PATH}/peers?active=true`
    : `${API_BASE_WITH_PATH}/peers`;
  const res = await axios.get(url);
  return res.data.peers || [];
}

export async function fetchPeerById(id) {
  const res = await axios.get(`${API_BASE_WITH_PATH}/peers/${id}`);
  return res.data.peer;
}

export async function registerPeer(peerData) {
  const res = await axios.post(`${API_BASE_WITH_PATH}/peers`, peerData);
  return res.data.peer;
}

export async function sendDirectMessage(messageData) {
  const res = await axios.post(`${API_BASE_WITH_PATH}/messages`, messageData);
  return res.data.message;
}

export async function fetchMessages(recipientId = null, senderId = null) {
  const params = new URLSearchParams();
  if (recipientId) params.append("recipientId", recipientId);
  if (senderId) params.append("senderId", senderId);
  
  const url = `${API_BASE_WITH_PATH}/messages${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await axios.get(url);
  return res.data.messages || [];
}

export async function fetchConversation(peerId1, peerId2) {
  // Fetch messages between two peers
  const [messages1, messages2] = await Promise.all([
    fetchMessages(peerId2, peerId1), // Messages from peerId1 to peerId2
    fetchMessages(peerId1, peerId2), // Messages from peerId2 to peerId1
  ]);
  
  // Combine and sort by timestamp
  const allMessages = [...messages1, ...messages2].sort((a, b) => {
    const timeA = new Date(a.timestamp || a.storedAt || 0);
    const timeB = new Date(b.timestamp || b.storedAt || 0);
    return timeA - timeB;
  });
  
  return allMessages;
}

