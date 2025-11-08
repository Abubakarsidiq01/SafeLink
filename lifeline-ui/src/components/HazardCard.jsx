export default function HazardCard({ hazard }) {
  if (!hazard) return null;
  const { name, date, source, link } = hazard;
  return (
    <div style={{border:"1px solid #e5e7eb", padding:12, borderRadius:10}}>
      <div style={{fontWeight:600}}>{name}</div>
      {date && <div style={{fontSize:12, opacity:.7, marginTop:4}}>{date}</div>}
      <div style={{fontSize:12, marginTop:6}}>
        {source || "GDACS"} · {link ? <a href={link} target="_blank" rel="noopener noreferrer">View</a> : "—"}
      </div>
    </div>
  );
}

