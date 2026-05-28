"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export default function TravelMap({ items, onItemClick }) {
  const t = useTranslations("Travel");
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
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
      }

      const map = mapInstanceRef.current;

      // Clear old markers
      for (const m of markersRef.current) {
        m.remove();
      }
      markersRef.current = [];

      if (items.length === 0) {
        map.setView([51.1657, 10.4515], 6);
        return;
      }

      // Group items by location to avoid duplicates
      const groupedItems = items.reduce((acc, item) => {
        if (!item.latitude || !item.longitude) return acc;
        const key = `${item.latitude},${item.longitude}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      }, {});

      const bounds = [];
      for (const [coords, itemsAtLoc] of Object.entries(groupedItems)) {
        const [lat, lon] = coords.split(",").map(parseFloat);

        const isOwn = itemsAtLoc.some((i) => i.isOwn);
        const hasAccommodation = itemsAtLoc.some(
          (i) => i.type === "accommodation",
        );

        const bgColor = isOwn ? "bg-primary" : "bg-primary/40";

        const iconHtml = hasAccommodation
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>`;

        const icon = L.divIcon({
          className: "custom-div-icon",
          html: `<div class="w-10 h-10 rounded-full ${bgColor} text-white border-2 border-white shadow-lg flex items-center justify-center">${iconHtml}</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        });

        const marker = L.marker([lat, lon], { icon }).addTo(map);

        const popupContent = document.createElement("div");
        popupContent.className = "p-1 space-y-2";
        for (const item of itemsAtLoc) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className =
            "block w-full text-left hover:text-primary transition-colors";
          btn.innerHTML = `<p class="font-bold text-sm">${item.name}</p><p class="text-xs text-muted-foreground">${item.type === "accommodation" ? t("accommodationLabel") : "Event"}</p>`;
          btn.onclick = () => {
            onItemClick(item);
          };
          popupContent.appendChild(btn);
        }

        marker.bindPopup(popupContent);
        markersRef.current.push(marker);
        bounds.push([lat, lon]);
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView([51.1657, 10.4515], 6);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [items, onItemClick, t]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-xl-custom overflow-hidden border border-border shadow-inner bg-muted z-10"
    />
  );
}
