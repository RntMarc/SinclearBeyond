"use client";

import { Bookmark, Star, Utensils, TreePine, MapPin, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useEffect, useMemo, useRef } from "react";
import DiscoverSearch from "@/components/discover/DiscoverSearch";
import dynamic from "next/dynamic";
import OpeningStatusBadge from "@/components/discover/OpeningStatusBadge";

const ResultsMap = dynamic(() => import("./ResultsMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Karte wird geladen...</p>
    </div>
  ),
});

export default function DiscoverClient({ initialRandomPlaces, bookmarks }) {
  const t = useTranslations("Discover");
  const ts = useTranslations("Discover.search");

  const [places, setPlaces] = useState(initialRandomPlaces);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("list"); // "list" or "map"
  const searchRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const mode = params.get("mode");
    const lat = params.get("lat");
    const lon = params.get("lon");
    const radius = params.get("radius");

    if (q || (mode && lat && lon)) {
      handleSearch({
        query: q || "",
        mode: mode || "in",
        location: lat && lon ? { lat, lon } : null,
        radius: radius ? parseInt(radius) : 10
      });
    }
  }, []);

  async function handleSearch(searchParams) {
    setLoading(true);
    setIsSearching(true);
    try {
      let url = `/api/discover/places?q=${encodeURIComponent(searchParams.query || "")}`;
      if (searchParams.mode) url += `&mode=${searchParams.mode}`;
      if (searchParams.location) {
        url += `&lat=${searchParams.location.lat}&lon=${searchParams.location.lon}`;
        if (searchParams.location.display_name) {
          url += `&locationName=${encodeURIComponent(searchParams.location.display_name)}`;
        }
      }
      if (searchParams.radius) url += `&radius=${searchParams.radius}`;

      const res = await fetch(url);
      const data = await res.json();
      setPlaces(data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  }

  const focusSearch = () => {
    const input = document.querySelector('input[placeholder="' + ts("placeholder") + '"]');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Search Bar */}
      <section className="pt-2">
        <DiscoverSearch onSearch={handleSearch} />
      </section>

      {/* Results / Categories */}
      {!isSearching ? (
        <>
          {/* Categories */}
          <section>
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              {t("categoriesLabel")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/entdecken/gastronomie"
                className="group p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all shadow-sm flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Utensils size={24} />
                </div>
                <div>
                  <h3 className="font-bold">{t("categories.gastronomy")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("gastronomyDesc")}
                  </p>
                </div>
              </Link>

              <div className="p-6 bg-muted/50 border border-border/50 rounded-2xl flex items-center gap-4 grayscale opacity-60 cursor-not-allowed">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                  <TreePine size={24} />
                </div>
                <div>
                  <h3 className="font-bold">{t("categories.leisure")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("leisureDesc")}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Random Places / Search More */}
          <section>
            <h2 className="text-lg font-bold mb-6">Vorschläge</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {places.map((place) => (
                <PlaceCard key={place.id} place={place} t={t} />
              ))}
              <button
                onClick={focusSearch}
                className="p-6 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center group hover:border-primary/50 transition-all bg-card/50"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <SearchIcon size={24} />
                </div>
                <p className="text-sm font-bold text-muted-foreground group-hover:text-foreground">
                  {ts("moreResults")}
                </p>
              </button>
            </div>
          </section>

          {/* Bookmarks */}
          <section>
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Bookmark size={20} className="text-primary" />
              {t("bookmarks")}
            </h2>
            {bookmarks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarks.map((place) => (
                  <Link
                    key={place.id}
                    href={`/entdecken/orte/${place.id}`}
                    className="p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-all shadow-sm"
                  >
                    <h3 className="font-bold text-sm truncate">{place.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {place.address}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center">
                <Bookmark size={32} className="text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground max-w-xs">
                  {t("noBookmarks")}
                </p>
              </div>
            )}
          </section>
        </>
      ) : (
        /* Search Results View */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">Suchergebnisse</h2>
            <button
              onClick={() => setIsSearching(false)}
              className="text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              Suche beenden
            </button>
          </div>

          {/* Mobile Tabs */}
          <div className="flex md:hidden bg-muted p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "list" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              {ts("list")}
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "map" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              {ts("map")}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* List View */}
            <div className={`${activeTab === "map" ? "hidden md:block" : "block"} space-y-4`}>
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-primary mb-4" size={32} />
                  <p className="text-muted-foreground">Ergebnisse werden geladen...</p>
                </div>
              ) : places.length > 0 ? (
                places.map((place, index) => (
                  <Link
                    key={place.id}
                    href={`/entdecken/orte/${place.id}`}
                    className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold truncate group-hover:text-primary transition-colors">
                        {place.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {place.address}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {t(`categories.${place.category}`)}
                        </span>
                        <OpeningStatusBadge
                          status={place.openingStatus}
                          size="xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-orange-500 shrink-0">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold">
                        {place.avgRating ? Number(place.avgRating).toFixed(1) : "-"}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-20 border-2 border-dashed border-border rounded-3xl text-center">
                  <p className="text-muted-foreground">{ts("noResults")}</p>
                </div>
              )}
            </div>

            {/* Map View */}
            <div className={`${activeTab === "list" ? "hidden md:block" : "block"} md:sticky md:top-6 h-[400px] md:h-[600px]`}>
              <ResultsMap places={places} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceCard({ place, t }) {
  return (
    <Link
      href={`/entdecken/orte/${place.id}`}
      className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all shadow-sm flex flex-col"
    >
      <div className="p-6 space-y-4">
        <div>
          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
            {place.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {place.address}
          </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {t(`categories.${place.category}`)}
                      </span>
                    </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-orange-500">
              <Star
                size={16}
                fill={place.avgRating ? "currentColor" : "none"}
              />
              <span className="text-sm font-bold">
                {place.avgRating ? Number(place.avgRating).toFixed(1) : "-"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({place.reviewCount} {t("reviews")})
            </span>
          </div>
          <OpeningStatusBadge status={place.openingStatus} size="xs" />
        </div>
      </div>
    </Link>
  );
}


function Loader2({ className, size }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin ${className}`}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
