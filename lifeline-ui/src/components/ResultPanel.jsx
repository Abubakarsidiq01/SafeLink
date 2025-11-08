import HazardCard from "./HazardCard";

export default function ResultPanel({ result }) {
  const dest = result?.destination;
  const route = result?.route;

  return (
    <div style={{display:"grid", gridTemplateColumns:"1.2fr .8fr", gap:16, marginTop:16}}>
      <div style={{border:"1px solid #e5e7eb", borderRadius:12, padding:16}}>
        <h2 style={{fontWeight:700, fontSize:18, marginBottom:8}}>Recommended Destination</h2>
        <div><b>{dest?.name}</b></div>
        <div style={{fontSize:13, opacity:.8}}>
          Distance: {dest?.distance_km} km · ETA: {route?.eta} · ({route?.distance})
        </div>
        {result?.ai_reason && (
          <div style={{marginTop:10, padding:10, background:"#f8fafc", borderRadius:8, fontSize:14}}>
            🧠 <i>{result.ai_reason}</i>
          </div>
        )}
      </div>

      <div>
        <div style={{border:"1px solid #e5e7eb", borderRadius:12, padding:16, marginBottom:12}}>
          <h3 style={{fontWeight:700, fontSize:16}}>Hazards Nearby</h3>
          {Array.isArray(result?.hazards) && result.hazards.length > 0 ? (
            <div style={{display:"grid", gap:8, marginTop:8}}>
              {result.hazards.map((h, i) => <HazardCard key={i} hazard={h} />)}
            </div>
          ) : (
            <div style={{fontSize:13, opacity:.7, marginTop:8}}>No active disasters found.</div>
          )}
          {result?.hazard_warning && (
            <div style={{marginTop:10, color:"#b45309"}}>⚠️ Hazard detected — route chosen with caution.</div>
          )}
        </div>
      </div>
    </div>
  );
}

