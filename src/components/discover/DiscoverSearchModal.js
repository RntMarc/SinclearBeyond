"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";
import DiscoverSearch from "./DiscoverSearch";
import { useRouter } from "next/navigation";

export default function DiscoverSearchModal({ onClose }) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  const handleSearch = (searchParams) => {
    // Redirect to discover page with search params
    const params = new URLSearchParams();
    if (searchParams.query) params.set("q", searchParams.query);
    if (searchParams.mode) params.set("mode", searchParams.mode);
    if (searchParams.location) {
      params.set("lat", searchParams.location.lat);
      params.set("lon", searchParams.location.lon);
    }
    if (searchParams.radius) params.set("radius", searchParams.radius);

    router.push(`/entdecken?${params.toString()}`);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center p-4 md:p-10 pt-20">
      <div
        className={`absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      <div
        className={`relative w-full max-w-3xl transition-all duration-200 ${
          isClosing
            ? "opacity-0 scale-95 -translate-y-4"
            : "opacity-100 scale-100 translate-y-0"
        }`}
      >
        <div className="absolute -top-12 right-0">
          <button
            onClick={handleClose}
            className="p-2 bg-card border border-border rounded-full hover:bg-accent transition-colors text-muted-foreground"
          >
            <X size={20} />
          </button>
        </div>
        <DiscoverSearch onSearch={handleSearch} />
      </div>
    </div>
  );
}
