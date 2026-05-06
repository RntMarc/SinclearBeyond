"use client";

import { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  ArrowLeft,
  Loader2,
  Plus,
  Star,
  Utensils,
  TreePine,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SaveButton from "@/components/SaveButton";

export default function AddPlacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "gastronomy";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [form, setForm] = useState({
    category: initialCategory,
    rating: 5,
    comment: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/discover/osm/search?q=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError("Suche fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!selectedPlace) return;
    setSaving(true);
    setError("");
    try {
      // 1. Get full details from OSM for this specific item
      // Nominatim search results already have some details, but let's get cleaner ones if needed.
      // Actually, for simplicity, we'll use what we have or a quick lookup.

      const res = await fetch(`/api/discover/places`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...selectedPlace,
          category: form.category,
          rating: form.rating,
          comment: form.comment,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/entdecken/orte/${data.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Fehler beim Speichern.");
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="px-6 py-6 border-b border-border bg-card shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link
            href="/entdecken"
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-black">Neuen Ort hinzufügen</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Step 1: Search OSM */}
          {!selectedPlace && (
            <section className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Schritt 1: Ort finden
                </h2>
                <p className="text-sm text-muted-foreground">
                  Suche in OpenStreetMap nach dem Ort, den du hinzufügen
                  möchtest.
                </p>
              </div>

              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    autoFocus
                    className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none"
                    placeholder="Name oder Adresse des Restaurants..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {loading
                    ? <Loader2 size={18} className="animate-spin" />
                    : <Search size={18} />}
                  Suchen
                </button>
              </form>

              <div className="space-y-2">
                {results.map((item) => (
                  <button
                    key={item.osmId}
                    onClick={() => setSelectedPlace(item)}
                    className="w-full p-4 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all text-left flex items-start gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <MapPin size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.address}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {item.class}:{item.type}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}

                {query && results.length === 0 && !loading && (
                  <div className="p-10 border-2 border-dashed border-border rounded-3xl text-center text-muted-foreground text-sm">
                    Keine Ergebnisse gefunden. Probiere es mit einem anderen
                    Suchbegriff.
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Step 2: Details & Review */}
          {selectedPlace && (
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    Schritt 2: Details ergänzen
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Erste Bewertung abgeben und Kategorie bestätigen.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Anderen Ort wählen
                </button>
              </div>

              <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <Check size={24} />
                </div>
                <div>
                  <h3 className="font-bold">{selectedPlace.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlace.address}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      Kategorie
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          setForm({ ...form, category: "gastronomy" })
                        }
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${form.category === "gastronomy" ? "bg-primary/10 border-primary text-primary" : "bg-card border-border hover:border-muted-foreground/30"}`}
                      >
                        <Utensils size={20} />
                        <span className="text-xs font-bold">Gastronomie</span>
                      </button>
                      <button
                        disabled
                        className="p-4 rounded-xl border border-border bg-muted/50 text-muted-foreground/50 flex flex-col items-center gap-2 cursor-not-allowed opacity-60"
                      >
                        <TreePine size={20} />
                        <span className="text-xs font-bold">Freizeit</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      Deine Bewertung
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setForm({ ...form, rating: s })}
                          className={`p-1 transition-colors ${form.rating >= s ? "text-orange-500" : "text-muted-foreground/30"}`}
                        >
                          <Star
                            size={24}
                            fill={form.rating >= s ? "currentColor" : "none"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      Kommentar (Optional)
                    </label>
                    <textarea
                      className="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm min-h-[100px] focus:ring-2 ring-primary/20 outline-none"
                      placeholder="Wie hat es dir gefallen?"
                      value={form.comment}
                      onChange={(e) =>
                        setForm({ ...form, comment: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-end pt-6 border-t border-border">
                <SaveButton loading={saving} onClick={handleImport}>
                  Ort hinzufügen & speichern
                </SaveButton>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
