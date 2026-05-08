"use client";

import {
  Check,
  Loader2,
  MapPin,
  Search,
  Star,
  TreePine,
  Utensils,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import SaveButton from "@/components/SaveButton";

export default function AddPlaceModal({
  initialCategory = "gastronomy",
  onClose,
}) {
  const router = useRouter();
  const t = useTranslations("Discover");
  const tCommon = useTranslations("Common");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  const [form, setForm] = useState({
    category: initialCategory,
    rating: 5,
    comment: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

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
        handleClose();
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      <div
        className={`relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 max-h-[90vh] ${
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-semibold">{t("addPlaceTitle")}</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {/* Step 1: Search OSM */}
            {!selectedPlace && (
              <section className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    {t("step1")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("step1Desc")}
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
                      className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none"
                      placeholder={t("searchPlaceholder")}
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
                    {t("searchButton")}
                  </button>
                </form>

                <div className="grid grid-cols-1 gap-2">
                  {results.map((item) => (
                    <button
                      key={`${item.osmId}-${item.osmType}`}
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
                      </div>
                    </button>
                  ))}

                  {query && results.length === 0 && !loading && (
                    <div className="p-10 border-2 border-dashed border-border rounded-3xl text-center text-muted-foreground text-sm">
                      {t("noResults")}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Step 2: Details & Review */}
            {selectedPlace && (
              <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      {t("step2")}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {t("step2Desc")}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPlace(null)}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground"
                  >
                    {t("changePlace")}
                  </button>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <Check size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate">
                      {selectedPlace.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedPlace.address}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">
                        {t("categoryLabel")}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, category: "gastronomy" })
                          }
                          className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${form.category === "gastronomy" ? "bg-primary/10 border-primary text-primary" : "bg-sidebar-accent/30 border-sidebar-border text-muted-foreground hover:border-muted-foreground/30"}`}
                        >
                          <Utensils size={18} />
                          <span className="text-[10px] font-bold">
                            {t("categories.gastronomy")}
                          </span>
                        </button>
                        <button
                          type="button"
                          disabled
                          className="p-3 rounded-xl border border-border bg-muted/50 text-muted-foreground/50 flex flex-col items-center gap-1 cursor-not-allowed opacity-60"
                        >
                          <TreePine size={18} />
                          <span className="text-[10px] font-bold">
                            {t("categories.leisure")}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">
                        {t("yourRating")}
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
                              size={20}
                              fill={form.rating >= s ? "currentColor" : "none"}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">
                        {t("commentOptional")}
                      </label>
                      <textarea
                        className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-2 text-sm min-h-[80px] focus:ring-2 ring-primary/20 outline-none resize-none"
                        placeholder="..."
                        value={form.comment}
                        onChange={(e) =>
                          setForm({ ...form, comment: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20">
                    {error}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {tCommon("cancel")}
          </button>
          {selectedPlace && (
            <SaveButton loading={saving} onClick={handleImport}>
              {t("savePlace")}
            </SaveButton>
          )}
        </div>
      </div>
    </div>
  );
}
