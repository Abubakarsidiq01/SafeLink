import { useEffect, useState } from "react";
import axios from "axios";
import ResultPanel from "../components/ResultPanel";
import MapView from "../components/MapView";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function CrisisRoute() {
  // Get intent from URL parameters (passed from MedAIInput)
  const getIntentFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const urlIntent = params.get("intent");
    // Normalize to ensure valid values
    if (urlIntent === "hospital" || urlIntent === "safeplace") {
      return urlIntent;
    }
    return "hospital"; // default fallback
  };

  const [intent, setIntent] = useState(getIntentFromURL());
  const [coords, setCoords] = useState(null);        // {lat, lon}
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // Update intent if URL changes
  useEffect(() => {
    const urlIntent = getIntentFromURL();
    if (urlIntent !== intent) {
      setIntent(urlIntent);
      console.log("🧠 Intent updated from URL:", urlIntent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Grab browser location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      p => setCoords({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => setError("Location blocked. Enable GPS to demo."),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
    );
  }, []);

  async function fetchRoute() {
    if (!coords) { setError("No location yet…"); return; }
    setLoading(true); setError(""); setData(null);
    try {
      const url = `${API_BASE}/api/routes?lat=${coords.lat}&lon=${coords.lon}&intent=${intent}`;
      const res = await axios.get(url);
      setData(res.data);
    } catch (e) {
      setError("Failed to fetch route. Check backend running & CORS.");
    } finally {
      setLoading(false);
    }
  }

  // Automatically fetch route when coords and intent are available
  useEffect(() => {
    if (coords && intent) {
      console.log("🚀 Auto-fetching route with intent:", intent);
      fetchRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, intent]);

  return (
    <div style={{maxWidth: 920, margin: "0 auto", padding: 16}}>
      <h1 style={{fontSize: 28, fontWeight: 700}}>LifeLine AI — CrisisRoute</h1>

      <div style={{display: "flex", gap: 8, marginTop: 12, alignItems:"center"}}>
        <span style={{fontSize:14, fontWeight:600}}>
          Intent: <span style={{color:"#2563eb"}}>{intent}</span> (Auto-detected from MedAI)
        </span>
        {loading && (
          <span style={{fontSize:14, color:"#64748b"}}>🔄 Calculating route...</span>
        )}
        {!loading && !data && coords && (
          <span style={{fontSize:14, color:"#64748b"}}>⏳ Waiting for location...</span>
        )}
        <span style={{fontSize:12, opacity:.7}}>
          {coords ? `📍 ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` : "Getting location…"}
        </span>
      </div>
      
      <div style={{marginTop: 8, fontSize: 12, color: "#64748b"}}>
        Need to change intent? <a href="/" style={{color: "#2563eb"}}>Go back to input</a>
      </div>

      {error && <div style={{marginTop:12, color:"#b91c1c"}}>{error}</div>}

      {data && (
        <>
          <MapView mapUrl={data?.route?.map_url} />
          <ResultPanel result={data} />
        </>
      )}
    </div>
  );
}

