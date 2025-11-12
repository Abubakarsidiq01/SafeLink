// app/services/crypto/Encryptor.js

import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";

let AsyncStorage = global.AsyncStorage;

if (!AsyncStorage) {
  try {
    // React Native environment
    AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  } catch {
    // Node test fallback
    console.log("[SafeLink] ⚙️ Using in-memory AsyncStorage mock in Encryptor");
    AsyncStorage = {
      storage: {},
      async setItem(key, value) { this.storage[key] = value; },
      async getItem(key) { return this.storage[key] || null; },
      async removeItem(key) { delete this.storage[key]; },
    };
  }
}

const AES_KEY_STORAGE_KEY = "@safelink_aes_key";

class Encryptor {
  constructor() {
    this.key = null;
  }

  async getOrCreateKey() {
    if (this.key) return this.key;

    let stored = await AsyncStorage.getItem(AES_KEY_STORAGE_KEY);
    if (!stored) {
      // 256 bit key as random UUID string hash
      const raw = uuidv4() + uuidv4();
      const key = CryptoJS.SHA256(raw).toString();
      await AsyncStorage.setItem(AES_KEY_STORAGE_KEY, key);
      stored = key;
      console.log("[SafeLink] 🔑 Generated new AES key");
    } else {
      console.log("[SafeLink] 🔑 Loaded existing AES key");
    }

    this.key = stored;
    return this.key;
  }

  async encrypt(plainText) {
    const key = await this.getOrCreateKey();
    const cipher = CryptoJS.AES.encrypt(plainText, key).toString();
    return cipher; // base64 string
  }

  async decrypt(cipherText) {
    const key = await this.getOrCreateKey();
    try {
      const bytes = CryptoJS.AES.decrypt(cipherText, key);
      const plain = bytes.toString(CryptoJS.enc.Utf8);
      return plain;
    } catch (e) {
      console.error("[SafeLink] ❌ Decryption failed:", e.message);
      return null;
    }
  }
}

export default new Encryptor();
