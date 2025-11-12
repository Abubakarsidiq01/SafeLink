// app/services/ai/PriorityClassifier.js

// Simple heuristic classifier for message urgency (placeholder for TFLite)
import { PRIORITY_LEVELS } from "../../app/constants/messageSchema.js";

class PriorityClassifier {
  classify(text, meta = {}) {
    if (!text) return "normal";

    const lower = text.toLowerCase();

    if (
      lower.includes("life-threatening") ||
      lower.includes("under fire") ||
      lower.includes("bleeding") ||
      lower.includes("trapped") ||
      lower.includes("explosion")
    ) {
      return "critical";
    }

    if (
      lower.includes("injured") ||
      lower.includes("medical") ||
      lower.includes("no water") ||
      lower.includes("no food")
    ) {
      return "high";
    }

    if (lower.includes("status") || lower.includes("update")) {
      return "low";
    }

    // fallback to meta if provided
    if (meta.priority && PRIORITY_LEVELS.includes(meta.priority)) {
      return meta.priority;
    }

    return "normal";
  }
}

export default new PriorityClassifier();

