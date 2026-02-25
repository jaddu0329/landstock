import React, { useEffect, useRef } from 'react';
export default function MapSection({ coordinates }) {
  const mapRef = useRef(null);
  useEffect(() => {
    if (!window.L) return;
    const map = window.L.map(mapRef.current).setView(coordinates, 13);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    window.L.marker(coordinates).addTo(map);
    return () => map.remove();
  }, [coordinates]);
  return <div ref={mapRef} className="h-full w-full rounded-2xl" />;
}