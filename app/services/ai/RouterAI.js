// app/services/ai/RouterAI.js

import { getAllPeers } from "../storage/PeerCache.js";

/**
 * RouterAI
 * Picks the best next-hop peer for message delivery
 * using a heuristic scoring system.
 * 
 * In a full build, this can be replaced with a
 * trained ML model (TensorFlow.js or TFLite).
 */
class RouterAI {
  constructor() {
    this.history = []; // store previous routing performance
  }

  /**
   * Calculate a route score for each peer.
   * The higher the score, the more reliable the peer.
   */
  calculatePeerScore(peer) {
    const rssiScore = this.normalizeRSSI(peer.rssi);
    const distanceScore = peer.distance ? Math.max(0, 10 - parseFloat(peer.distance)) : 0;
    const reliabilityScore = this.getReliability(peer.id);

    // Weighted heuristic: 60% RSSI, 30% distance, 10% reliability
    return rssiScore * 0.6 + distanceScore * 0.3 + reliabilityScore * 0.1;
  }

  // Normalize RSSI (-100 to -30) to a 0–10 scale
  normalizeRSSI(rssi) {
    if (!rssi) return 0;
    const minRSSI = -100;
    const maxRSSI = -30;
    return Math.max(0, Math.min(10, ((rssi - minRSSI) / (maxRSSI - minRSSI)) * 10));
  }

  // Get reliability based on past successful deliveries
  getReliability(peerId) {
    const records = this.history.filter((h) => h.peerId === peerId);
    if (records.length === 0) return 5; // neutral
    const successRate = records.filter((r) => r.success).length / records.length;
    return successRate * 10;
  }

  // Record delivery outcome (for future learning)
  recordResult(peerId, success) {
    this.history.push({ peerId, success, timestamp: Date.now() });
    if (this.history.length > 1000) this.history.shift();
  }

  // Choose the best peer for message delivery
  async selectBestPeer() {
    const peers = await getAllPeers();
    if (peers.length === 0) {
      console.log("[SafeLink] ❌ No peers available for routing.");
      return null;
    }

    const scoredPeers = peers.map((p) => ({
      ...p,
      score: this.calculatePeerScore(p),
    }));

    scoredPeers.sort((a, b) => b.score - a.score);
    const best = scoredPeers[0];
    console.log(
      `[SafeLink] 🧠 Best peer selected: ${best.name} (score: ${best.score.toFixed(2)})`
    );
    return best;
  }
}

export default new RouterAI();
