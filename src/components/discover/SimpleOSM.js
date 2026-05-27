"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import NavigationFAB from "@/components/ui/NavigationFAB";

export default function SimpleOSM({ lat, lon, zoom = 15, name }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // We need to import leaflet dynamically to avoid SSR issues
    const initMap = async () => {
      const L = (await import("leaflet")).default;

      if (!mapInstanceRef.current && mapRef.current) {
        // Fix for default marker icons in Leaflet with Webpack/Next.js
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png",
        });

        const map = L.map(mapRef.current).setView([lat, lon], zoom);
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        L.marker([lat, lon]).addTo(map).bindPopup(name);
      } else if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lon], zoom);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lon, zoom, name]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapRef}
        className="w-full h-full rounded-lg-custom overflow-hidden border border-border shadow-inner bg-muted z-10"
      ></div>
      <NavigationFAB lat={lat} lon={lon} name={name} />
    </div>
  );
}
