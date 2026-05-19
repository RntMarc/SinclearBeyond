"use client";

import { ExternalLink, Play, ShoppingCart, X } from "lucide-react";
import { useTranslations } from "next-intl";
import BrandIcon from "@/components/BrandIcon";
import Button from "@/components/ui/Button";

const PROVIDER_MAPPING = {
  amazon: { name: "Amazon", icon: "Amazon" },
  apple_music: { name: "Apple Music", icon: "Applemusic" },
  spotify: { name: "Spotify", icon: "Spotify" },
  itunes: { name: "iTunes", icon: "Itunes" },
  bandcamp: { name: "Bandcamp", icon: "Bandcamp" },
  deezer: { name: "Deezer", icon: "Deezer" },
  tidal: { name: "TIDAL", icon: "Tidal" },
  youtube: { name: "YouTube", icon: "Youtube" },
  discogs: { name: "Discogs", icon: "Discogs" },
};

export default function LinkSelectionModal({ isOpen, onClose, links, type }) {
  const t = useTranslations("Reviews");

  if (!isOpen) return null;

  const filteredLinks = links.filter((link) => {
    if (type === "buy") {
      return [
        "purchase for download",
        "discogs",
        "amazon",
        "bandcamp",
        "itunes",
      ].some((t) => link.type.toLowerCase().includes(t));
    } else {
      return [
        "streaming",
        "free streaming",
        "spotify",
        "deezer",
        "tidal",
        "youtube",
        "apple music",
      ].some((t) => link.type.toLowerCase().includes(t));
    }
  });

  const getProviderInfo = (url, linkType) => {
    const lowercaseUrl = url.toLowerCase();
    for (const [key, info] of Object.entries(PROVIDER_MAPPING)) {
      if (lowercaseUrl.includes(key.replace("_", ""))) {
        return info;
      }
    }
    return { name: linkType, icon: null };
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-t-3xl md:rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${type === "buy" ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"}`}
            >
              {type === "buy" ? <ShoppingCart size={24} /> : <Play size={24} />}
            </div>
            <h3 className="font-bold text-xl">
              {type === "buy" ? t("buyOn") : t("streamOn")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {filteredLinks.length > 0 ? (
            filteredLinks.map((link, i) => {
              const info = getProviderInfo(link.url, link.type);
              return (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    {info.icon ? (
                      <BrandIcon
                        name={info.icon}
                        size={24}
                        className="text-muted-foreground group-hover:text-foreground transition-colors"
                      />
                    ) : (
                      <ExternalLink
                        size={24}
                        className="text-muted-foreground group-hover:text-foreground transition-colors"
                      />
                    )}
                    <span className="font-bold">{info.name}</span>
                  </div>
                  <ExternalLink
                    size={16}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </a>
              );
            })
          ) : (
            <p className="text-center py-10 text-muted-foreground text-sm">
              {t("noLinksFound")}
            </p>
          )}
        </div>

        <Button
          onClick={onClose}
          variant="secondary"
          className="w-full py-4 rounded-2xl"
        >
          {t("close")}
        </Button>
      </div>
    </div>
  );
}
