"use client";
import { Plus, Star, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import SaveButton from "@/components/SaveButton";

export default function PollForm({ initialData, saving, onSubmit, onCancel }) {
  const t = useTranslations("Polls");
  const tc = useTranslations("Common");

  const [form, setForm] = useState(
    initialData || {
      title: "",
      options: [{ startAt: "" }],
      invites: [],
    },
  );
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { startAt: "" }],
    }));
  };

  const removeOption = (index) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleOptionChange = (index, value) => {
    setForm((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = { ...newOptions[index], startAt: value };
      return { ...prev, options: newOptions };
    });
  };

  const toggleInvite = (user) => {
    setForm((prev) => {
      const isInvited = prev.invites.some((i) => i.userId === user.id);
      if (isInvited) {
        return {
          ...prev,
          invites: prev.invites.filter((i) => i.userId !== user.id),
        };
      }
      return {
        ...prev,
        invites: [
          ...prev.invites,
          { userId: user.id, isIndispensable: false },
        ],
      };
    });
  };

  const toggleIndispensable = (userId) => {
    setForm((prev) => ({
      ...prev,
      invites: prev.invites.map((i) =>
        i.userId === userId ? { ...i, isIndispensable: !i.isIndispensable } : i,
      ),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) &&
      !form.invites.some((i) => i.userId === u.id),
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {/* Title */}
        <div className="space-y-1.5">
          <label
            htmlFor="poll-title"
            className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1"
          >
            {t("pollTitle")}
          </label>
          <input
            id="poll-title"
            type="text"
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, title: e.target.value }))
            }
            required
            placeholder={t("pollTitlePlaceholder")}
            className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1">
            {t("options")}
          </p>
          <div className="space-y-3">
            {form.options.map((opt, index) => (
              <div key={opt.id || index} className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={
                    opt.startAt
                      ? new Date(
                          new Date(opt.startAt).getTime() -
                            new Date(opt.startAt).getTimezoneOffset() * 60000,
                        )
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required
                  className="flex-1 bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {form.options.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-3 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-sidebar-border rounded-xl text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
            >
              <Plus size={16} />
              {t("addOption")}
            </button>
          </div>
        </div>

        {/* Invites */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1">
            {t("invites")}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {form.invites.map((invite) => {
              const user = users.find((u) => u.id === invite.userId);
              if (!user) return null;
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-2 bg-sidebar-accent/50 border border-sidebar-border rounded-full pl-1 pr-3 py-1"
                >
                  <Avatar user={user} size="xs" />
                  <span className="text-xs font-medium">{user.displayName}</span>
                  <button
                    type="button"
                    onClick={() => toggleIndispensable(user.id)}
                    className={`p-1 rounded-full transition-colors ${invite.isIndispensable ? "text-yellow-500 bg-yellow-500/10" : "text-muted-foreground hover:text-yellow-500"}`}
                    title={t("indispensable")}
                  >
                    <Star
                      size={12}
                      fill={invite.isIndispensable ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleInvite(user)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground">
              <UserPlus size={16} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("inviteUsers")}
              className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {search && (
            <div className="bg-sidebar-accent/50 border border-sidebar-border rounded-xl overflow-hidden divide-y divide-sidebar-border max-h-48 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      toggleInvite(user);
                      setSearch("");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-sidebar-accent transition-colors text-left"
                  >
                    <Avatar user={user} size="xs" />
                    <span className="text-sm">{user.displayName}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                  {tc("noEntries")}
                </div>
              )}
            </div>
          )}
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
          {t("form.save")}
        </SaveButton>
      </div>
    </form>
  );
}
