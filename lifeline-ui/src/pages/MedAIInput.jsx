import { useState, useEffect } from "react";
import axios from "axios";
import ResultPanel from "../components/ResultPanel";
import MapView from "../components/MapView";

// Use main backend server (port 4000)
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function MedAIInput() {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [findingRoute, setFindingRoute] = useState(false);
  const [intent, setIntent] = useState(null);
  const [pendingIntent, setPendingIntent] = useState(null); // Intent waiting for location

  // Normalize recommendation from Test/main.py to intent format
  const normalizeIntent = (recommendation) => {
    const normalized = recommendation.toLowerCase().replace("-", "").replace(" ", "");
    if (normalized.includes("hospital")) {
      return "hospital";
    } else if (normalized.includes("safe") || normalized.includes("place")) {
      return "safeplace";
    }
    return "hospital"; // default fallback
  };

  // Get user's location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      p => setCoords({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => setError("Location blocked. Enable GPS to find your route."),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
    );
  }, []);

  // Auto-fetch route when coords become available and we have a pending intent
  useEffect(() => {
    if (coords && pendingIntent && !routeData && !findingRoute) {
      console.log("📍 Location available, fetching route for intent:", pendingIntent);
      const intentToFetch = pendingIntent;
      setPendingIntent(null); // Clear pending intent first
      fetchRoute(intentToFetch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, pendingIntent]);

  // Fetch route from main API
  const fetchRoute = async (detectedIntent) => {
    if (!coords) {
      setError("Location not available. Please enable GPS.");
      return;
    }

    setFindingRoute(true);
    setError("");
    setRouteData(null);

    try {
      const url = `${API_BASE}/api/routes?lat=${coords.lat}&lon=${coords.lon}&intent=${detectedIntent}`;
      const res = await axios.get(url);
      setRouteData(res.data);
      setIntent(detectedIntent);
    } catch (e) {
      setError("Failed to fetch route. Check backend running & CORS.");
      console.error("Route fetch error:", e);
    } finally {
      setFindingRoute(false);
    }
  };

  // 🎙 Voice Input
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      setRecording(true);
      setError("");

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "input.webm");

        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/api/medai/process_audio`, {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }

          const data = await res.json();
          const recommendation = data.recommendation || "Hospital";
          const detectedIntent = normalizeIntent(recommendation);
          
          console.log("🎤 Audio recommendation:", recommendation, "→ intent:", detectedIntent);
          
          // Set intent immediately to show loading screen
          setIntent(detectedIntent);
          
          // Automatically fetch route after getting recommendation
          if (coords) {
            fetchRoute(detectedIntent);
          } else {
            // Wait for location - useEffect will handle fetching when coords are available
            setPendingIntent(detectedIntent);
          }
        } catch (err) {
          console.error("Error processing audio:", err);
          setError("Failed to process audio. Please check your connection and try again.");
        } finally {
          setLoading(false);
          setRecording(false);
          stream.getTracks().forEach((t) => t.stop());
        }
      };

      mediaRecorder.start();

      // Auto stop after 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 5000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Microphone access denied. Please enable microphone permissions.");
      setRecording(false);
    }
  };

  // ✍️ Text Input
  const handleTextSubmit = async () => {
    if (!text.trim()) {
      setError("Please enter some text.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/medai/process_text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const recommendation = data.recommendation || "Hospital";
      const detectedIntent = normalizeIntent(recommendation);
      
      console.log("✍️ Text recommendation:", recommendation, "→ intent:", detectedIntent);
      
      // Set intent immediately to show loading screen
      setIntent(detectedIntent);
      
      // Automatically fetch route after getting recommendation
      if (coords) {
        fetchRoute(detectedIntent);
      } else {
        // Wait for location - useEffect will handle fetching when coords are available
        setPendingIntent(detectedIntent);
      }
    } catch (err) {
      console.error("Error processing text:", err);
      setError("Failed to process text. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show route results if available
  if (routeData) {
    return (
      <div style={{maxWidth: 920, margin: "0 auto", padding: 16}}>
        <h1 style={{fontSize: 28, fontWeight: 700}}>LifeLine AI — CrisisRoute</h1>

        <div style={{display: "flex", gap: 8, marginTop: 12, alignItems:"center"}}>
          <span style={{fontSize:14, fontWeight:600}}>
            Intent: <span style={{color:"#2563eb"}}>{intent}</span> (Auto-detected from MedAI)
          </span>
          <span style={{fontSize:12, opacity:.7}}>
            {coords ? `📍 ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` : ""}
          </span>
        </div>
        
        <div style={{marginTop: 8, fontSize: 12, color: "#64748b"}}>
          Need to change intent? <a href="/" style={{color: "#2563eb"}} onClick={(e) => { e.preventDefault(); window.location.reload(); }}>Start over</a>
        </div>

        {error && <div style={{marginTop:12, color:"#b91c1c"}}>{error}</div>}

        <MapView mapUrl={routeData?.route?.map_url} />
        <ResultPanel result={routeData} />
      </div>
    );
  }

  // Show "Finding best routes to safety..." loading state
  // Show when: fetching route OR processing MedAI input OR waiting for location after getting intent
  if (findingRoute || loading || (intent && !routeData && !error) || pendingIntent) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "linear-gradient(to bottom, #f0f9ff, #e0f2fe)"
      }}>
        <div style={{
          textAlign: "center",
          maxWidth: 500
        }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16, color: "#1e40af" }}>
            Finding best routes to safety...
          </h1>
          <div style={{
            fontSize: 18,
            color: "#64748b",
            marginBottom: 32
          }}>
            Analyzing your situation and calculating the safest route
          </div>
          <div style={{
            display: "inline-block",
            width: 40,
            height: 40,
            border: "4px solid #e0e7ff",
            borderTop: "4px solid #2563eb",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Show input form
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      background: "linear-gradient(to bottom, #f0f9ff, #e0f2fe)"
    }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
        🌪 Disaster Help Assistant
      </h1>
      <p style={{ fontSize: 16, color: "#64748b", marginBottom: 32 }}>
        Describe your situation and we'll find the best route for you
      </p>

      {/* Voice Input */}
      <button
        onClick={startRecording}
        disabled={recording || loading}
        style={{
          backgroundColor: recording ? "#94a3b8" : "#2563eb",
          color: "white",
          padding: "12px 24px",
          borderRadius: 12,
          border: "none",
          fontSize: 16,
          fontWeight: 600,
          cursor: recording || loading ? "not-allowed" : "pointer",
          marginBottom: 16,
          minWidth: 200
        }}
      >
        {recording ? "🎙 Recording..." : loading ? "Processing..." : "🎙 Speak Your Situation"}
      </button>

      <div style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>OR</div>

      {/* Text Input */}
      <textarea
        style={{
          border: "2px solid #cbd5e1",
          borderRadius: 12,
          width: "100%",
          maxWidth: 400,
          padding: 16,
          marginBottom: 12,
          fontSize: 16,
          minHeight: 120,
          resize: "vertical"
        }}
        rows={4}
        placeholder="Or type your situation here... (e.g., 'I need urgent medical help' or 'I need a safe place to stay')"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
      />
      <button
        onClick={handleTextSubmit}
        disabled={loading || !text.trim()}
        style={{
          backgroundColor: loading || !text.trim() ? "#94a3b8" : "#16a34a",
          color: "white",
          padding: "12px 24px",
          borderRadius: 12,
          border: "none",
          fontSize: 16,
          fontWeight: 600,
          cursor: loading || !text.trim() ? "not-allowed" : "pointer",
          minWidth: 200
        }}
      >
        {loading ? "Processing..." : "Submit Text"}
      </button>

      {/* Error Message */}
      {error && (
        <div style={{
          marginTop: 24,
          padding: 12,
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
          borderRadius: 8,
          maxWidth: 400,
          textAlign: "center"
        }}>
          {error}
        </div>
      )}

      {/* Info */}
      <div style={{
        marginTop: 32,
        padding: 16,
        backgroundColor: "#f1f5f9",
        borderRadius: 8,
        maxWidth: 400,
        fontSize: 14,
        color: "#475569",
        textAlign: "center"
      }}>
        💡 Tip: Say or type your emergency situation clearly. 
        The AI will determine if you need a Hospital or Safe Place.
      </div>
    </div>
  );
}

