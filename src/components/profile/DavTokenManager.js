"use client";

import { Key, Copy, RefreshCw, Check } from "lucide-react";
import { useState } from "react";
import { generateDavToken } from "@/lib/profile/profile";

export default function DavTokenManager({ initialToken }) {
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (
      !confirm(
        "Möchtest du wirklich einen neuen Token generieren? Der alte Token wird sofort ungültig.",
      )
    ) {
      return;
    }
    setLoading(true);
    const res = await generateDavToken();
    if (res.ok) {
      setToken(res.token);
    } else {
      alert(res.error || "Fehler beim Generieren des Tokens.");
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Key size={20} />
        </div>
        <div>
          <h3 className="text-lg font-medium text-foreground">
            CalDAV & CardDAV
          </h3>
          <p className="text-sm text-muted-foreground">
            Synchronisiere deinen Kalender und Kontakte mit externen Apps.
          </p>
        </div>
      </div>

      <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block font-medium">
          Dein persönlicher Zugangs-Token
        </label>

        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <input
              type="text"
              readOnly
              value={token || "Kein Token generiert"}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all pr-10"
            />
            {token && (
              <button
                type="button"
                onClick={copyToClipboard}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-primary transition-colors"
                title="Kopieren"
              >
                {copied
                  ? <Check size={16} className="text-green-500" />
                  : <Copy size={16} />}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm active:scale-95"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {token ? "Neu" : "Generieren"}
          </button>
        </div>

        {token && (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              Server-Informationen
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex flex-col p-2 bg-background border border-border rounded-lg">
                <span className="text-muted-foreground mb-0.5">Nutzername</span>
                <span className="font-mono text-foreground select-all break-all">
                  Deine E-Mail Adresse
                </span>
              </div>
              <div className="flex flex-col p-2 bg-background border border-border rounded-lg">
                <span className="text-muted-foreground mb-0.5">Passwort</span>
                <span className="font-mono text-foreground">Obiger Token</span>
              </div>
              <div className="flex flex-col p-2 bg-background border border-border rounded-lg">
                <span className="text-muted-foreground mb-0.5">Server-URL</span>
                <span className="font-mono text-foreground select-all break-all">
                  {typeof window !== "undefined" ? window.location.origin : ""}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
        Nutze diese Daten für die manuelle Einrichtung in Apps wie Apple
        Kalender, Thunderbird oder Outlook. Der Zugriff erfolgt ausschließlich
        lesend.
      </p>
    </div>
  );
}
