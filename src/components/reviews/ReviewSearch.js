"use client";

import { Loader2, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

export default function ReviewSearch({ type = "game" }) {
  const t = useTranslations("Reviews.search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setLoading(true);
        setIsOpen(true);
        try {
          const res = await fetch(
            `/api/kritik/search?q=${encodeURIComponent(query)}&type=${type}`,
          );
          const data = await res.json();
          setResults(data);
        } catch (err) {
          console.error("Search error", err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, type]);

  const handleImport = async (item) => {
    try {
      const res = await fetch("/api/kritik/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const savedItem = await res.json();

      let target = "/kritik/spiele";
      if (item.type === "movie") target = "/kritik/filme";
      if (item.type === "music") target = "/kritik/musik";

      router.push(`${target}/${savedItem.id}`);
    } catch (err) {
      console.error("Import error", err);
    }
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={20}
        />
        <input
          type="text"
          placeholder={t(`${type}Placeholder`)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 2 && setIsOpen(true)}
          className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-xl-custom focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
        />
        {loading && (
          <Loader2
            className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary"
            size={20}
          />
        )}
      </div>

      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute z-50 mt-2 w-full bg-card border border-border rounded-xl-custom shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
            {results.map((item) => (
              <button
                type="button"
                key={item.externalId}
                onClick={() => handleImport(item)}
                className="w-full flex items-center gap-4 p-3 hover:bg-muted rounded-[2rem] transition-colors text-left group"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-12 h-16 object-cover rounded-2xl shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-16 bg-muted rounded-2xl flex items-center justify-center">
                    <Plus className="text-muted-foreground/30" size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.releaseDate}
                  </p>
                </div>
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-[2rem] text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                  {t("import")}
                </div>
              </button>
            ))}
            {!loading && results.length === 0 && query.length > 2 && (
              <div className="p-8 text-center text-muted-foreground italic text-sm">
                {t("noResults")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
