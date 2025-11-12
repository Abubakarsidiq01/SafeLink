// app/services/mesh/MeshManager.js

import NodeDiscovery from "./NodeDiscovery.js";
import MessageRelay from "./MessageRelay.js";
import GeoBroadcast from "./GeoBroadcast.js";
import SyncManager from "./SyncManager.js";
import AlertManager from "./AlertManager.js";
import HealthMonitor from "../storage/HealthMonitor.js";
import { nowISO } from "../../utils/TimeUtils.js";

class MeshManager {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    console.log("[SafeLink][MeshManager] 🧩 Initializing mesh stack...");
    await NodeDiscovery.init?.();
    await SyncManager.initialize?.();
    await AlertManager.init();
    this.initialized = true;
    console.log("[SafeLink][MeshManager] ✅ Mesh stack ready.");
  }

  // Discovery controls
  async scanOnce() {
    return NodeDiscovery.startDiscovery();
  }

  getPeers() {
    return NodeDiscovery.getPeers();
  }

  // Direct messaging
  async sendDirectMessage(senderId, receiverId, content, meta = {}) {
    await this.init();
    const msg = await MessageRelay.createMessage(senderId, receiverId, content, meta);
    await MessageRelay.deliverMessage(msg);
    return msg;
  }

  // Broadcast wrapper
  async broadcastAlert(senderId, content, options) {
    await this.init();
    return GeoBroadcast.broadcast(senderId, content, options);
  }

  // Relief wrapper
  async createReliefRequest(senderId, payload) {
    await this.init();
    return AlertManager.createReliefRequestAndAlert(senderId, payload);
  }

  async getOpenReliefRequests() {
    return AlertManager.getOpenReliefRequests();
  }

  async getHealthSnapshot() {
    return HealthMonitor.collect();
  }

  async manualSync() {
    await SyncManager.startSync?.();
    return {
      timestamp: nowISO(),
      status: "ok",
    };
  }
}

export default new MeshManager();

