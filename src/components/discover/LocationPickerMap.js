"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export default function LocationPickerMap({ lat, lon, onChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      if (!mapInstanceRef.current && mapRef.current) {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png",
        });

        const initialLat = lat || 51.1657;
        const initialLon = lon || 10.4515;
        const initialZoom = lat && lon ? 15 : 6;

        const map = L.map(mapRef.current).setView(
          [initialLat, initialLon],
          initialZoom,
        );
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        if (lat && lon) {
          markerRef.current = L.marker([lat, lon]).addTo(map);
        }

        map.on("click", (e) => {
          const { lat: newLat, lng: newLon } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng(e.latlng);
          } else {
            markerRef.current = L.marker(e.latlng).addTo(map);
          }
          onChange(newLat, newLon);
        });
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [lat, lon, onChange]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-2xl overflow-hidden border border-border shadow-inner bg-muted z-10"
    ></div>
  );
}
