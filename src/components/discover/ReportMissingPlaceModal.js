"use client";

import { MapPin, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import SubmitButton from "@/components/ui/SubmitButton";
import { fetchAction } from "@/lib/asyncAction";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center rounded-xl border border-border">
      <p className="text-xs text-muted-foreground italic">
        Karte wird geladen...
      </p>
    </div>
  ),
});

export default function ReportMissingPlaceModal({ onClose }) {
  const t = useTranslations("Discover.reportModal");
  const tCommon = useTranslations("Common");

  const [isClosing, setIsClosing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    address: "",
    googleMapsLink: "",
    website: "",
    latitude: null,
    longitude: null,
  });

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

  const validate = () => {
    if (form.googleMapsLink.trim()) return true;
    if (
      form.name.trim() &&
      (form.address.trim() ||
        (form.latitude !== null && form.longitude !== null))
    )
      return true;
    return false;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      setError(t("error"));
      return { ok: false, error: t("error") };
    }

    setError("");

    const result = await fetchAction(
      "/api/feedback",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "missing_place",
          ...form,
        }),
      },
      { fallbackError: tCommon("saveError") },
    );

    if (result.ok) {
      setSuccess(true);
      setTimeout(handleClose, 2000);
      return { ok: true };
    }
    setError(result.error || tCommon("saveError"));
    return { ok: false, error: result.error };
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="absolute inset-0"
        onClick={handleClose}
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
        role="button"
        tabIndex={-1}
      />

      <div
        className={`relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 max-h-[90vh] ${
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-semibold">{t("title")}</h2>
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
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <MapPin size={32} />
              </div>
              <p className="text-lg font-medium">{t("success")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-sm text-muted-foreground">
                {t("description")}
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="place-name"
                    className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1"
                  >
                    {t("name")}
                  </label>
                  <input
                    id="place-name"
                    type="text"
                    className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="place-address"
                    className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1"
                  >
                    {t("address")}
                  </label>
                  <input
                    id="place-address"
                    type="text"
                    className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="google-maps-link"
                      className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1"
                    >
                      {t("googleMapsLink")}
                    </label>
                    <input
                      id="google-maps-link"
                      type="url"
                      className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none"
                      value={form.googleMapsLink}
                      onChange={(e) =>
                        setForm({ ...form, googleMapsLink: e.target.value })
                      }
                      placeholder="https://goo.gl/maps/..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="place-website"
                      className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1"
                    >
                      {t("website")}
                    </label>
                    <input
                      id="place-website"
                      type="url"
                      className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none"
                      value={form.website}
                      onChange={(e) =>
                        setForm({ ...form, website: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1">
                    {t("coordinates")}
                  </span>
                  <div className="h-48 rounded-xl border border-border overflow-hidden">
                    <LocationPickerMap
                      lat={form.latitude}
                      lon={form.longitude}
                      onChange={(lat, lon) =>
                        setForm({ ...form, latitude: lat, longitude: lon })
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
            </form>
          )}
        </div>

        {!success && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {tCommon("cancel")}
            </button>
            <SubmitButton
              onClick={handleSubmit}
              label={t("submit")}
              successToast={t("success")}
              errorToast={tCommon("saveError")}
              successDuration={0}
            />
          </div>
        )}
      </div>
    </div>
  );
}
