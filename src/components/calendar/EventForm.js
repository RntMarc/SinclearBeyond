"use client";
import { useTranslations } from "next-intl";
import PermissionEditor from "@/components/calendar/PermissionEditor";
import SubmitButton from "@/components/ui/SubmitButton";

export default function EventForm({
  form,
  setForm,
  allUsers,
  creatorId,
  saving,
  formError,
  onSubmit,
  onCancel,
}) {
  const t = useTranslations("Calendar.form");
  const tc = useTranslations("Common");

  return (
    <form
      onSubmit={onSubmit}
      className="px-6 py-5 flex flex-col gap-4 overflow-y-auto"
    >
      <input
        type="text"
        placeholder={t("title")}
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        required
        className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
      />
      <textarea
        placeholder={t("description")}
        value={form.description}
        onChange={(e) =>
          setForm((f) => ({ ...f, description: e.target.value }))
        }
        rows={2}
        className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
      />

      <button
        type="button"
        onClick={() => setForm((f) => ({ ...f, allDay: !f.allDay }))}
        className="flex items-center gap-3 w-fit"
      >
        <div
          className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${form.allDay ? "bg-primary" : "bg-border"}`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.allDay ? "translate-x-4" : "translate-x-0.5"}`}
          />
        </div>
        <span className="text-sm text-muted-foreground">{t("allDay")}</span>
      </button>

      {form.allDay ? (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">{t("date")}</label>
          <input
            type="date"
            value={form.startAt.slice(0, 10)}
            onChange={(e) =>
              setForm((f) => ({ ...f, startAt: e.target.value }))
            }
            required
            className="px-4 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">
              {t("start")}
            </label>
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(e) =>
                setForm((f) => ({ ...f, startAt: e.target.value }))
              }
              required
              className="px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">{t("end")}</label>
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(e) =>
                setForm((f) => ({ ...f, endAt: e.target.value }))
              }
              className="px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
        className="flex items-center gap-3 w-fit"
      >
        <div
          className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${form.isPublic ? "bg-primary" : "bg-border"}`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isPublic ? "translate-x-4" : "translate-x-0.5"}`}
          />
        </div>
        <span className="text-sm text-muted-foreground">{t("public")}</span>
      </button>

      <PermissionEditor
        allUsers={allUsers}
        creatorId={creatorId}
        isPublic={form.isPublic}
        permissions={form.permissions}
        onChange={(perms) => setForm((f) => ({ ...f, permissions: perms }))}
      />

      {formError && <p className="text-destructive text-sm">{formError}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-full border border-border text-muted-foreground text-sm hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          {tc("cancel")}
        </button>
        <SubmitButton
          type="submit"
          loading={saving}
          label={tc("save")}
          savingLabel={tc("saving")}
          disabled={!form.title.trim()}
          successDuration={0}
          showInlineError={false}
          className="flex-1 rounded-full"
        />
      </div>
    </form>
  );
}
