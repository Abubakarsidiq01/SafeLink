// app/services/crypto/IdentityManager.js

import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";

let AsyncStorage = global.AsyncStorage;

if (!AsyncStorage) {
  try {
    AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  } catch {
    console.log("[SafeLink] ⚙️ Using in-memory AsyncStorage mock in IdentityManager");
    AsyncStorage = {
      storage: {},
      async setItem(key, value) { this.storage[key] = value; },
      async getItem(key) { return this.storage[key] || null; },
      async removeItem(key) { delete this.storage[key]; },
    };
  }
}

const IDENTITY_STORAGE_KEY = "@safelink_identity";

class IdentityManager {
  constructor() {
    this.identity = null;
  }

  async getOrCreateIdentity() {
    if (this.identity) return this.identity;

    let stored = await AsyncStorage.getItem(IDENTITY_STORAGE_KEY);
    if (!stored) {
      const deviceId = uuidv4();
      const signingKey = CryptoJS.SHA256(uuidv4() + uuidv4()).toString();

      const identity = { deviceId, signingKey };
      await AsyncStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
      this.identity = identity;
      console.log("[SafeLink] 🆔 Created new device identity");
    } else {
      this.identity = JSON.parse(stored);
      console.log("[SafeLink] 🆔 Loaded existing device identity");
    }

    return this.identity;
  }

  async getDeviceId() {
    const id = await this.getOrCreateIdentity();
    return id.deviceId;
  }

  async signPayload(payload) {
    const { signingKey } = await this.getOrCreateIdentity();
    const body = typeof payload === "string" ? payload : JSON.stringify(payload);
    const hash = CryptoJS.HmacSHA256(body, signingKey).toString(CryptoJS.enc.Hex);
    return hash;
  }

  async buildSignedMessage(content, extraMeta = {}) {
    const deviceId = await this.getDeviceId();
    const payload = {
      from: deviceId,
      content,
      timestamp: new Date().toISOString(),
      ...extraMeta,
    };
    const signature = await this.signPayload(payload);
    return { payload, signature };
  }

  // Static style helpers for verification
  verifySignature(payload, signature, signingKey) {
    const body = typeof payload === "string" ? payload : JSON.stringify(payload);
    const expected = CryptoJS.HmacSHA256(body, signingKey).toString(CryptoJS.enc.Hex);
    return expected === signature;
  }
}

export default new IdentityManager();
