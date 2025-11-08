export default function MapView({ mapUrl }) {
  if (!mapUrl) return null;
  return (
    <div style={{marginTop:16}}>
      <iframe
        title="Route Map"
        src={mapUrl}
        width="100%"
        height="420"
        style={{border:0, borderRadius:12}}
        loading="lazy"
        allowFullScreen
      />
    </div>
  );
}

