"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export default function ResultsMap({ places, showNumbers = true }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      if (!mapInstanceRef.current && mapRef.current) {
        const map = L.map(mapRef.current);
        mapInstanceRef.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
      }

      if (places.length === 0) {
        if (mapInstanceRef.current) {
           mapInstanceRef.current.setView([51.1657, 10.4515], 6);
        }
        return;
      }

      const map = mapInstanceRef.current;

      // Clear old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      const bounds = [];
      places.forEach((place, index) => {
        if (place.latitude && place.longitude) {
          const lat = parseFloat(place.latitude);
          const lon = parseFloat(place.longitude);

          const categoryColor =
            place.category === 'gastronomy' ? 'bg-orange-500' :
            place.category === 'leisure' ? 'bg-green-500' :
            'bg-primary';

          const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-8 h-8 rounded-full ${categoryColor} text-white border-2 border-white shadow-lg flex items-center justify-center font-black text-sm">${showNumbers ? (places.length > 50 ? '' : index + 1) : ''}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          });

          const marker = L.marker([lat, lon], { icon }).addTo(map)
            .bindPopup(`<b>${place.name}</b><br/>${place.address}`);

          markersRef.current.push(marker);
          bounds.push([lat, lon]);
        }
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView([51.1657, 10.4515], 6); // Germany center
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [places]);

  return (
    <div ref={mapRef} className="w-full h-full rounded-3xl overflow-hidden border border-border shadow-inner bg-muted z-10" />
  );
}
