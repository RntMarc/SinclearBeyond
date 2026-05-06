"use client";

import { useEffect, useRef } from "react";

export default function SimpleOSM({ lat, lon, zoom = 15, name }) {
  const mapRef = useRef(null);

  // Using mlat and mlon for markers in OSM export embed
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.005},${lat - 0.005},${lon + 0.005},${lat + 0.005}&layer=mapnik&mlat=${lat}&mlon=${lon}`;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-border shadow-inner bg-muted">
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight="0"
        marginWidth="0"
        src={mapUrl}
        title={name}
        className="grayscale-[0.2] contrast-[1.1]"
      ></iframe>
    </div>
  );
}
