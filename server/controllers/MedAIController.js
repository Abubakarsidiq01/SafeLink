// server/controllers/MedAIController.js
// AI processing for medical/disaster assistance recommendations

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.warn("[MedAIController] ⚠️ GEMINI_API_KEY not found in environment variables");
}

const genai = apiKey ? new GoogleGenerativeAI(apiKey) : null;

let model = null;

// Initialize model - returns null if fails, so fallback can be used
async function initializeModel() {
  if (!genai) {
    console.warn("[MedAIController] ⚠️ No API key available, will use keyword fallback");
    return null;
  }
  
  if (model) return model;
  
  // Use gemini-pro which is the most stable and widely supported
  try {
    model = genai.getGenerativeModel({ model: "gemini-pro" });
    console.log(`[MedAIController] ✅ Gemini model initialized: gemini-pro`);
    return model;
  } catch (error) {
    console.warn(`[MedAIController] ⚠️ Failed to initialize gemini-pro: ${error.message}`);
    // Try alternative model names if gemini-pro fails
    const alternatives = ["gemini-1.5-flash", "gemini-1.5-pro"];
    for (const altModel of alternatives) {
      try {
        model = genai.getGenerativeModel({ model: altModel });
        console.log(`[MedAIController] ✅ Using alternative model: ${altModel}`);
        return model;
      } catch (e) {
        console.log(`[MedAIController] ⚠️ ${altModel} also failed: ${e.message}`);
        continue;
      }
    }
    console.warn(`[MedAIController] ⚠️ All AI models failed, will use keyword fallback`);
    return null; // Return null instead of throwing, so fallback can work
  }
}

// Normalize recommendation to standard format
function normalizeRecommendation(recommendation) {
  const normalized = recommendation.toLowerCase().replace(/-/g, "").replace(/\s/g, "").replace("_", "");
  if (normalized.includes("hospital") || normalized.includes("medical") || normalized.includes("doctor") || normalized.includes("bleeding") || normalized.includes("injured")) {
    return "hospital";
  } else if (normalized.includes("police") || normalized.includes("911") || normalized.includes("emergency") || normalized.includes("crime") || normalized.includes("danger")) {
    return "police";
  } else if (normalized.includes("safe") || normalized.includes("place") || normalized.includes("shelter")) {
    return "safeplace";
  }
  return "hospital"; // default fallback
}

// Simple keyword-based fallback when AI fails
function analyzeWithKeywords(message) {
  const lowerMessage = message.toLowerCase();
  
  // Medical keywords
  const medicalKeywords = ["bleeding", "bleed", "injured", "injury", "hurt", "pain", "medical", "doctor", "hospital", "ambulance", "sick", "ill", "wound", "cut", "broken", "fracture"];
  // Police keywords
  const policeKeywords = ["police", "911", "crime", "criminal", "danger", "dangerous", "threat", "attack", "robbery", "stolen", "emergency", "help", "danger", "unsafe"];
  // Safe place keywords
  const safePlaceKeywords = ["safe", "shelter", "place", "stay", "housing", "accommodation", "refuge", "protection"];
  
  // Count matches
  const medicalCount = medicalKeywords.filter(kw => lowerMessage.includes(kw)).length;
  const policeCount = policeKeywords.filter(kw => lowerMessage.includes(kw)).length;
  const safeCount = safePlaceKeywords.filter(kw => lowerMessage.includes(kw)).length;
  
  // Determine recommendation
  if (medicalCount > policeCount && medicalCount > safeCount) {
    return "hospital";
  } else if (policeCount > safeCount) {
    return "police";
  } else if (safeCount > 0) {
    return "safeplace";
  }
  
  // Default to hospital for urgent-sounding messages
  if (lowerMessage.includes("urgent") || lowerMessage.includes("emergency") || lowerMessage.includes("help")) {
    return "hospital";
  }
  
  return "hospital"; // Default fallback
}

// Process text input
async function processText(req, res) {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Missing message",
        message: "Please provide a message describing the situation",
      });
    }

    let recommendation = "hospital"; // default
    
    // Try AI first, but use keyword fallback if it fails
    const aiModel = await initializeModel();
    
    if (aiModel) {
      try {
        const prompt = `
Analyze this emergency situation: "${message}"

Determine what type of help is needed:
- "hospital" - for medical emergencies (bleeding, injuries, medical help needed)
- "police" - for police assistance, crimes, security issues, or urgent police help
- "safeplace" - for shelters, safe places to stay, or non-urgent safety needs

Respond with JSON only in this format:
{"recommendation": "hospital"} or {"recommendation": "police"} or {"recommendation": "safeplace"}

Examples:
- "I am bleeding" → {"recommendation": "hospital"}
- "I need police help" → {"recommendation": "police"}
- "I need a safe place" → {"recommendation": "safeplace"}
- "Call 911" → {"recommendation": "police"}
`;

        const result = await aiModel.generateContent(prompt);
        const response = await result.response;
        let decisionText = response.text().trim();

        console.log("[MedAIController] 🔹 Gemini Response (Text):", decisionText);

        // Try to parse JSON
        try {
          // Remove markdown code blocks if present
          const cleanedText = decisionText.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanedText);
          recommendation = parsed.recommendation || decisionText;
        } catch (jsonError) {
          // If not JSON, try to extract from text
          recommendation = decisionText;
        }

        recommendation = normalizeRecommendation(recommendation);
        console.log("[MedAIController] ✅ AI processed:", recommendation);
        
      } catch (aiError) {
        // If AI fails, use keyword-based fallback
        console.warn("[MedAIController] ⚠️ AI processing failed, using keyword fallback:", aiError.message);
        recommendation = analyzeWithKeywords(message);
        console.log("[MedAIController] ✅ Keyword analysis:", recommendation);
      }
    } else {
      // No AI model available, use keyword fallback
      console.log("[MedAIController] ℹ️ Using keyword fallback (no AI available)");
      recommendation = analyzeWithKeywords(message);
      console.log("[MedAIController] ✅ Keyword analysis:", recommendation);
    }

    res.json({ 
      recommendation,
      needs911: recommendation === "police" // Flag if 911 should be called
    });
  } catch (error) {
    console.error("[MedAIController] ❌ Error processing text:", error);
    // Even on error, try keyword fallback
    try {
      const fallbackRecommendation = analyzeWithKeywords(req.body.message || "");
      return res.json({ 
        recommendation: fallbackRecommendation,
        needs911: fallbackRecommendation === "police"
      });
    } catch (fallbackError) {
      res.status(500).json({
        error: "Failed to process text",
        message: error.message,
      });
    }
  }
}

// Process audio input
async function processAudio(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No audio file",
        message: "Please provide an audio file",
      });
    }

    let recommendation = "hospital"; // default

    try {
      const audioBuffer = req.file.buffer;
      const audioData = {
        inlineData: {
          data: audioBuffer.toString("base64"),
          mimeType: req.file.mimetype || "audio/webm",
        },
      };

      const aiModel = await initializeModel();

      const prompt = `
Listen carefully to this audio from someone in an emergency.

Determine what type of help is needed:
- "hospital" - for medical emergencies (bleeding, injuries, medical help)
- "police" - for police assistance, crimes, security issues
- "safeplace" - for shelters, safe places to stay

Respond with JSON only:
{"recommendation": "hospital"} or {"recommendation": "police"} or {"recommendation": "safeplace"}
`;

      const result = await aiModel.generateContent([audioData, prompt]);
      const response = await result.response;
      let decisionText = response.text().trim();

      console.log("[MedAIController] 🔹 Gemini Response (Audio):", decisionText);

      // Try to parse JSON
      try {
        const cleanedText = decisionText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanedText);
        recommendation = parsed.recommendation || decisionText;
      } catch (jsonError) {
        recommendation = decisionText;
      }

      recommendation = normalizeRecommendation(recommendation);
      console.log("[MedAIController] ✅ Audio processed:", recommendation);
      
    } catch (aiError) {
      // If AI fails, return default hospital (audio processing requires AI)
      console.warn("[MedAIController] ⚠️ Audio processing failed, using default:", aiError.message);
      recommendation = "hospital";
    }

    res.json({ 
      recommendation,
      needs911: recommendation === "police" // Flag if 911 should be called
    });
  } catch (error) {
    console.error("[MedAIController] ❌ Error processing audio:", error);
    // Return default on error
    res.json({ 
      recommendation: "hospital",
      needs911: false
    });
  }
}

module.exports = {
  processText,
  processAudio,
};

