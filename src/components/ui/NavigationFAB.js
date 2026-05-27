"use client";

import { Compass, ExternalLink, Map as MapIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function NavigationFAB({ lat, lon, name }) {
  const [showMenu, setShowMenu] = useState(false);
  const t = useTranslations("Common.navigation");

  if (!lat || !lon) return null;

  const geoUrl = `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(name || "")})`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(name || "")}&ll=${lat},${lon}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;

  const handleNavigation = () => {
    // Try geo: link first
    window.location.href = geoUrl;

    // Show fallback menu after a short delay to give geo: a chance
    setTimeout(() => {
      setShowMenu(true);
    }, 500);
  };

  return (
    <div className="absolute bottom-4 right-4 z-[20]">
      <button
        type="button"
        onClick={handleNavigation}
        className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        title="Navigation"
      >
        <Compass size={24} />
      </button>

      {showMenu && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg">{t("title")}</h3>
              <button
                type="button"
                onClick={() => setShowMenu(false)}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-muted/50 hover:bg-muted rounded-lg-custom transition-colors group"
                onClick={() => setShowMenu(false)}
              >
                <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                  <ExternalLink size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Google Maps</p>
                  <p className="text-xs text-muted-foreground">
                    {t("openInApp")}
                  </p>
                </div>
              </a>

              <a
                href={appleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-muted/50 hover:bg-muted rounded-lg-custom transition-colors group"
                onClick={() => setShowMenu(false)}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <ExternalLink size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Apple Maps</p>
                  <p className="text-xs text-muted-foreground">
                    {t("openInApp")}
                  </p>
                </div>
              </a>

              <a
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-muted/50 hover:bg-muted rounded-lg-custom transition-colors group"
                onClick={() => setShowMenu(false)}
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                  <MapIcon size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">OpenStreetMap</p>
                  <p className="text-xs text-muted-foreground">
                    {t("openInBrowser")}
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
