"use client";

import { Crosshair, Loader2, MapPin, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

export default function DiscoverSearch({ onSearch, initialQuery = "" }) {
  const t = useTranslations("Discover.search");
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState("in"); // "in" or "around"
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [radius, setRadius] = useState(10);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showLocationResults, setShowLocationResults] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowLocationResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchLocations = useCallback(async (q) => {
    if (!q || q.length < 3) {
      setLocationResults([]);
      return;
    }
    setLoadingLocation(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
        { headers: { "User-Agent": "SinclearBeyond/1.0" } },
      );
      const data = await res.json();
      setLocationResults(data);
      setShowLocationResults(true);
    } catch (err) {
      console.error("Location search failed", err);
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationQuery && !selectedLocation) {
        searchLocations(locationQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [locationQuery, selectedLocation, searchLocations]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "User-Agent": "SinclearBeyond/1.0" } },
          );
          const data = await res.json();
          const loc = {
            display_name: data.display_name,
            lat: latitude,
            lon: longitude,
          };
          setSelectedLocation(loc);
          setLocationQuery(data.display_name);
          setShowLocationResults(false);
          setIsExpanded(true);
        } catch (err) {
          console.error("Reverse geocoding failed", err);
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error", error);
        setLoadingLocation(false);
      },
    );
  };

  const triggerSearch = () => {
    onSearch({
      query,
      mode,
      location: selectedLocation,
      radius,
    });
  };

  const handleClearLocation = () => {
    setSelectedLocation(null);
    setLocationQuery("");
    setLocationResults([]);
  };

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto space-y-2">
      <div
        className={`bg-card border border-border rounded-3xl shadow-lg overflow-hidden transition-all duration-300 ${isExpanded ? "ring-2 ring-primary/20" : ""}`}
      >
        {/* Main Search Input */}
        <div className="flex items-center px-4 py-2 gap-2">
          <Search size={20} className="text-muted-foreground shrink-0" />
          <input
            className="flex-1 bg-transparent border-none outline-none py-3 text-base placeholder:text-muted-foreground/50"
            placeholder={t("placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onKeyDown={(e) => e.key === "Enter" && triggerSearch()}
          />
          {isExpanded && (
            <button
              onClick={() => {
                setIsExpanded(false);
                setShowLocationResults(false);
              }}
              className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Expanded Controls */}
        <div
          className={`border-t border-border bg-muted/30 px-4 py-4 space-y-4 overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0 py-0 border-none"}`}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Mode Toggle */}
            <div className="flex bg-background border border-border p-1 rounded-xl shrink-0 h-fit">
              <button
                onClick={() => setMode("in")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === "in" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent text-muted-foreground"}`}
              >
                {t("modeIn")}
              </button>
              <button
                onClick={() => setMode("around")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === "around" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent text-muted-foreground"}`}
              >
                {t("modeAround")}
              </button>
            </div>

            {/* Location Input */}
            <div className="flex-1 relative">
              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-2 text-sm outline-none focus:ring-2 ring-primary/20"
                  placeholder={t("locationPlaceholder")}
                  value={locationQuery}
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    setSelectedLocation(null);
                  }}
                />
                {locationQuery && (
                  <button
                    onClick={handleClearLocation}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Location Results Dropdown */}
              {showLocationResults &&
                (locationResults.length > 0 || loadingLocation) && (
                  <div className="absolute z-[120] left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                    {loadingLocation ? (
                      <div className="p-4 flex items-center justify-center">
                        <Loader2
                          size={20}
                          className="animate-spin text-primary"
                        />
                      </div>
                    ) : (
                      <div className="max-h-[200px] overflow-y-auto">
                        {locationResults.map((loc) => (
                          <button
                            key={`${loc.lat}-${loc.lon}`}
                            onClick={() => {
                              setSelectedLocation(loc);
                              setLocationQuery(loc.display_name);
                              setShowLocationResults(false);
                            }}
                            className="w-full px-4 py-3 text-left text-sm hover:bg-accent flex items-start gap-3 border-b border-border last:border-0"
                          >
                            <MapPin
                              size={14}
                              className="mt-1 shrink-0 text-muted-foreground"
                            />
                            <span className="line-clamp-2">
                              {loc.display_name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Radius Input (only for around) */}
            {mode === "around" && (
              <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2 shrink-0">
                <span className="text-xs font-bold text-muted-foreground">
                  {t("radiusLabel")}
                </span>
                <input
                  type="number"
                  className="w-12 bg-transparent border-none outline-none text-sm font-bold text-center"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value, 10) || 0)}
                />
                <span className="text-xs text-muted-foreground">
                  {t("radiusUnit")}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleUseCurrentLocation}
              className="flex items-center gap-2 text-xs font-bold text-primary hover:opacity-80 transition-opacity"
            >
              <Crosshair size={14} />
              {t("useCurrentLocation")}
            </button>

            <button
              onClick={triggerSearch}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Search size={16} />
              {t("placeholder")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
