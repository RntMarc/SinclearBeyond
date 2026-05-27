"use client";

import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

export default function ExportManager() {
  const t = useTranslations("Settings.export");
  const tCommon = useTranslations("Common");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState({
    discover: true,
    media: true,
    episodes: true,
  });
  const [selectedItems, setSelectedItems] = useState({
    discover: [],
    media: [],
    episodes: [],
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/user/export");
        if (res.ok) {
          const json = await res.json();
          setData(json);
          // Pre-select all items
          setSelectedItems({
            discover: json.discover.map((i) => i.id),
            media: json.media.map((i) => i.id),
            episodes: json.episodes.map((i) => i.id),
          });
        }
      } catch (error) {
        console.error("Failed to fetch export data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleToggleType = (type) => {
    const newValue = !selectedTypes[type];
    setSelectedTypes((prev) => ({ ...prev, [type]: newValue }));

    if (newValue) {
      setSelectedItems((prev) => ({
        ...prev,
        [type]: data[type].map((i) => i.id),
      }));
    } else {
      setSelectedItems((prev) => ({
        ...prev,
        [type]: [],
      }));
    }
  };

  const handleToggleItem = (type, id) => {
    setSelectedItems((prev) => {
      const current = prev[type];
      if (current.includes(id)) {
        return { ...prev, [type]: current.filter((i) => i !== id) };
      }
      return { ...prev, [type]: [...current, id] };
    });
  };

  const handleExport = () => {
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      discover: data.discover.filter((i) =>
        selectedItems.discover.includes(i.id),
      ),
      media: data.media.filter((i) => selectedItems.media.includes(i.id)),
      episodes: data.episodes.filter((i) =>
        selectedItems.episodes.includes(i.id),
      ),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sinclear-beyond-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        {tCommon("loadError")}
      </div>
    );
  }

  const hasData =
    data.discover.length > 0 ||
    data.media.length > 0 ||
    data.episodes.length > 0;

  if (!hasData) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        {t("noData")}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-sidebar border border-sidebar-border rounded-lg-custom p-6 md:p-8">
        <h3 className="text-xl font-semibold mb-2">{t("title")}</h3>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          {t("description")}
        </p>

        <div className="space-y-6">
          {/* Discover Section */}
          {data.discover.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTypes.discover}
                    onChange={() => handleToggleType("discover")}
                    className="w-4 h-4 rounded border-sidebar-border text-primary focus:ring-primary bg-background"
                  />
                  {t("sections.discover")}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {selectedItems.discover.length} / {data.discover.length}
                </span>
              </div>
              {selectedTypes.discover && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                  {data.discover.map((review) => (
                    <label
                      key={review.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-sidebar-border hover:bg-sidebar-hover transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.discover.includes(review.id)}
                        onChange={() => handleToggleItem("discover", review.id)}
                        className="mt-1 w-4 h-4 rounded border-sidebar-border text-primary focus:ring-primary bg-background"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {review.place.name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>★ {review.rating}</span>
                          {review.place.osmId && (
                            <span className="bg-sidebar-accent/50 px-1.5 py-0.5 rounded text-[10px]">
                              OSM: {review.place.osmId}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Media Section */}
          {data.media.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTypes.media}
                    onChange={() => handleToggleType("media")}
                    className="w-4 h-4 rounded border-sidebar-border text-primary focus:ring-primary bg-background"
                  />
                  {t("sections.media")}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {selectedItems.media.length} / {data.media.length}
                </span>
              </div>
              {selectedTypes.media && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                  {data.media.map((review) => (
                    <label
                      key={review.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-sidebar-border hover:bg-sidebar-hover transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.media.includes(review.id)}
                        onChange={() => handleToggleItem("media", review.id)}
                        className="mt-1 w-4 h-4 rounded border-sidebar-border text-primary focus:ring-primary bg-background"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {review.item.title}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>★ {review.rating}</span>
                          {review.item.externalId && (
                            <span className="bg-sidebar-accent/50 px-1.5 py-0.5 rounded text-[10px]">
                              ID: {review.item.externalId}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Episodes Section */}
          {data.episodes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTypes.episodes}
                    onChange={() => handleToggleType("episodes")}
                    className="w-4 h-4 rounded border-sidebar-border text-primary focus:ring-primary bg-background"
                  />
                  {t("sections.episodes")}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {selectedItems.episodes.length} / {data.episodes.length}
                </span>
              </div>
              {selectedTypes.episodes && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                  {data.episodes.map((review) => (
                    <label
                      key={review.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-sidebar-border hover:bg-sidebar-hover transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.episodes.includes(review.id)}
                        onChange={() => handleToggleItem("episodes", review.id)}
                        className="mt-1 w-4 h-4 rounded border-sidebar-border text-primary focus:ring-primary bg-background"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {review.series.title} - {review.episode.title}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>★ {review.rating}</span>
                          <span>
                            S{review.episode.seasonNumber}E
                            {review.episode.episodeNumber}
                          </span>
                          {review.episode.externalId && (
                            <span className="bg-sidebar-accent/50 px-1.5 py-0.5 rounded text-[10px]">
                              ID: {review.episode.externalId}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-10 pt-6 border-t border-sidebar-border flex justify-end">
          <Button
            onClick={handleExport}
            disabled={
              selectedItems.discover.length === 0 &&
              selectedItems.media.length === 0 &&
              selectedItems.episodes.length === 0
            }
            className="gap-2"
          >
            <Download size={18} />
            {t("button")}
          </Button>
        </div>
      </div>
    </div>
  );
}
