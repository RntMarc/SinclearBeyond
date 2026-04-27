"use client";
import PermissionEditor from "@/components/calendar/PermissionEditor";

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
  return (
    <form
      onSubmit={onSubmit}
      className="px-6 py-5 flex flex-col gap-4 overflow-y-auto"
    >
      <input
        type="text"
        placeholder="Titel *"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        required
        autoFocus
        className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
      />
      <textarea
        placeholder="Beschreibung"
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
        <span className="text-sm text-muted-foreground">Ganztägig</span>
      </button>

      {form.allDay
        ? <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Datum</label>
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
        : <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Start *</label>
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
              <label className="text-xs text-muted-foreground">Ende</label>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endAt: e.target.value }))
                }
                className="px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>}

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
        <span className="text-sm text-muted-foreground">
          Öffentlich sichtbar
        </span>
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
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={saving || !form.title.trim()}
          className="flex-1 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? "Wird gespeichert…" : "Speichern"}
        </button>
      </div>
    </form>
  );
}
