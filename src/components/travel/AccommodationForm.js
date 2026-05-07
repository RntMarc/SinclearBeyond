"use client";

import { useTranslations } from "next-intl";
import SaveButton from "@/components/SaveButton";

export default function AccommodationForm({
  form,
  setForm,
  saving,
  formError,
  onSubmit,
  onCancel,
}) {
  const t = useTranslations("Travel.accommodation");
  const tc = useTranslations("Common");
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {formError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs">
            {formError}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1">
              {t("name")}
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder={t("placeholders.name")}
              className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1">
              {t("description")}
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder={t("placeholders.description")}
              rows={2}
              className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1">
              {t("address")}
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder={t("placeholders.address")}
              className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1">
                {t("latitude")}
              </label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                required
                placeholder={t("placeholders.latitude")}
                className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1">
                {t("longitude")}
              </label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                required
                placeholder={t("placeholders.longitude")}
                className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 bg-sidebar-accent/30 p-3 rounded-xl border border-sidebar-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary italic font-serif">
                M
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium">{t("mapIntegration")}</p>
                <p className="text-[10px] text-muted-foreground">
                  {t("mapPlaceholder")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1">
                {t("phone")}
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder={t("placeholders.phone")}
                className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1">
                {t("email")}
              </label>
              <input
                type="email"
                name="mail"
                value={form.mail}
                onChange={handleChange}
                placeholder={t("placeholders.email")}
                className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1">
              {t("osmId")}
            </label>
            <input
              type="text"
              name="osmId"
              value={form.osmId}
              onChange={handleChange}
              placeholder={t("placeholders.osmId")}
              className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <label className="flex items-center gap-3 p-4 bg-sidebar-accent/50 border border-sidebar-border rounded-xl cursor-pointer hover:bg-sidebar-accent/70 transition-all">
            <input
              type="checkbox"
              name="isHotel"
              checked={form.isHotel}
              onChange={handleChange}
              className="w-4 h-4 rounded border-sidebar-border text-primary focus:ring-primary/20"
            />
            <span className="text-sm font-medium">{t("isHotel")}</span>
          </label>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {tc("cancel")}
        </button>
        <SaveButton loading={saving} type="submit">
          {t("saveAccommodation")}
        </SaveButton>
      </div>
    </form>
  );
}
