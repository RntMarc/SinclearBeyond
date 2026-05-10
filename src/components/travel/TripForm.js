"use client";

import { useTranslations } from "next-intl";
import SaveButton from "@/components/SaveButton";
import { toUTCISOString } from "@/lib/dateUtils";

export default function TripForm({
  form,
  setForm,
  timezone,
  saving,
  formError,
  onSubmit,
  onCancel,
}) {
  const t = useTranslations("Travel.form");
  const tc = useTranslations("Common");
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
              rows={3}
              className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1">
                {t("start")}
              </label>
              <input
                type="datetime-local"
                name="start"
                value={form.start}
                onChange={handleChange}
                required
                className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1">
                {t("end")}
              </label>
              <input
                type="datetime-local"
                name="end"
                value={form.end}
                onChange={handleChange}
                required
                className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
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
          {t("saveTrip")}
        </SaveButton>
      </div>
    </form>
  );
}
