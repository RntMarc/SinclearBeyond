"use client";
import { X } from "lucide-react";
import { useState } from "react";
import EventForm from "@/components/calendar/EventForm";
import { toLocalDatetimeValue, toUTCISOString } from "@/lib/dateUtils";

const EMPTY_FORM = {
  title: "",
  description: "",
  startAt: "",
  endAt: "",
  allDay: false,
  isPublic: true,
  permissions: [],
};

export default function EventFormModal({
  mode,
  event,
  allUsers,
  userId,
  onClose,
  onCreated,
  onUpdated,
  timezone,
}) {
  const [form, setForm] = useState(() => {
    if (mode === "create" && event) {
      const start = new Date(event);
      start.setHours(10, 0, 0, 0);
      const end = new Date(event);
      end.setHours(11, 0, 0, 0);
      return {
        ...EMPTY_FORM,
        startAt: toLocalDatetimeValue(start, timezone),
        endAt: toLocalDatetimeValue(end, timezone),
      };
    }
    if (mode === "edit" && event) {
      const startDate = new Date(event.startAt);
      const endDate = event.endAt ? new Date(event.endAt) : null;
      return {
        title: event.title,
        description: event.description || "",
        startAt: event.allDay
          ? startDate.toISOString().slice(0, 10)
          : toLocalDatetimeValue(startDate, timezone),
        endAt: endDate ? toLocalDatetimeValue(endDate, timezone) : "",
        allDay: Boolean(event.allDay),
        isPublic: event.isPublic === undefined ? true : Boolean(event.isPublic),
        permissions: event.permissions ?? [],
      };
    }
    return EMPTY_FORM;
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function buildBody() {
    return {
      title: form.title,
      description: form.description || null,
      startAt: form.allDay
        ? `${form.startAt.slice(0, 10)}T00:00:00.000Z`
        : toUTCISOString(form.startAt, timezone),
      endAt: form.allDay
        ? form.endAt
          ? `${form.endAt.slice(0, 10)}T23:59:59.999Z`
          : null
        : toUTCISOString(form.endAt, timezone),
      allDay: form.allDay,
      isPublic: form.isPublic,
      permissions: form.permissions.map(({ userId, canView, canEdit }) => ({
        userId,
        canView,
        canEdit,
      })),
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    const url = mode === "edit" ? `/api/events/${event.id}` : "/api/events";
    const method = mode === "edit" ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildBody()),
    });

    setSaving(false);
    if (!res.ok) {
      setFormError("Fehler beim Speichern.");
      return;
    }

    const result = await res.json();
    mode === "edit" ? onUpdated(result) : onCreated(result);
    onClose();
  }

  const creatorId = mode === "edit" ? (event?.creatorId ?? userId) : userId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-lg-custom shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h3 className="text-sm font-medium text-foreground">
            {mode === "edit" ? "Eintrag bearbeiten" : "Neuer Eintrag"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <EventForm
          form={form}
          setForm={setForm}
          allUsers={allUsers}
          creatorId={creatorId}
          saving={saving}
          formError={formError}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
