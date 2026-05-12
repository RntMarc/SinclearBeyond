"use client";
import { Bed, Info, Mail, MapPin, Phone, X } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AccommodationDetailModal({ accommodation, onClose }) {
  const t = useTranslations("Travel.accommodation");
  const tc = useTranslations("Common");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-sidebar border border-sidebar-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-32 bg-primary/10 flex items-end px-6 pb-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-foreground transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-semibold shadow-lg border-4 border-sidebar">
              <Bed size={32} />
            </div>
            <div className="mb-1">
              <h2 className="text-xl font-semibold">{accommodation.name}</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {t("accommodationDetailLabel")}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            {accommodation.description && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground shrink-0">
                  <Info size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">
                    {t("description")}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {accommodation.description}
                  </p>
                </div>
              </div>
            )}

            {accommodation.address && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">
                    {t("address")}
                  </p>
                  <p className="text-sm text-foreground">
                    {accommodation.address}
                  </p>
                </div>
              </div>
            )}

            {(accommodation.phone || accommodation.mail) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accommodation.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground shrink-0">
                      <Phone size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">
                        {t("phone")}
                      </p>
                      <a
                        href={`tel:${accommodation.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {accommodation.phone}
                      </a>
                    </div>
                  </div>
                )}
                {accommodation.mail && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground shrink-0">
                      <Mail size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">
                        {t("email")}
                      </p>
                      <a
                        href={`mailto:${accommodation.mail}`}
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {accommodation.mail}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-sidebar-accent hover:bg-sidebar-accent/80 text-foreground rounded-xl font-medium transition-colors border border-sidebar-border"
            >
              {tc("close")}
            </button>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
