"use client";

import {
  AlertCircle,
  Banknote,
  Calendar,
  Check,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import SubmitButton from "@/components/ui/SubmitButton";
import { fetchAction } from "@/lib/asyncAction";
import { formatBirthday } from "@/lib/dateUtils";

export default function SubscriptionFormModal({
  subscription,
  onClose,
  onCreated,
  onUpdated,
}) {
  const t = useTranslations("Subscriptions.admin");
  const tc = useTranslations("Common");
  const [error, setError] = useState("");

  const [name, setName] = useState(subscription?.name || "");
  const [billingPeriodStart, setBillingPeriodStart] = useState(
    formatBirthday(subscription?.billingPeriodStart),
  );
  const [billingPeriodEnd, setBillingPeriodEnd] = useState(
    formatBirthday(subscription?.billingPeriodEnd),
  );
  const [basePrice, setBasePrice] = useState(
    subscription?.basePrice?.toString() || "",
  );
  const [members, setMembers] = useState(subscription?.members || []);

  const [allUsers, setAllUsers] = useState([]);
  const [_loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          setAllUsers(await res.json());
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      name,
      billingPeriodStart,
      billingPeriodEnd,
      basePrice: parseFloat(basePrice.replace(",", ".")),
      members,
    };

    const url = subscription
      ? `/api/subscriptions/${subscription.id}`
      : "/api/subscriptions";

    const method = subscription ? "PATCH" : "POST";

    const result = await fetchAction(
      url,
      {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      { fallbackError: tc("saveError") },
    );

    if (!result.ok) {
      setError(result.error);
      return { ok: false, error: result.error };
    }
    if (subscription) onUpdated?.();
    else onCreated?.();
    onClose();
    return { ok: true };
  };

  const handleDelete = async () => {
    if (!confirm(t("deleteConfirm")))
      return { ok: false, error: "Abgebrochen" };
    setError("");
    const result = await fetchAction(
      `/api/subscriptions/${subscription.id}`,
      { method: "DELETE" },
      { fallbackError: tc("deleteError") },
    );
    if (!result.ok) {
      setError(result.error);
      return { ok: false, error: result.error };
    }
    onUpdated?.();
    onClose();
    return { ok: true };
  };

  const addMember = () => {
    setMembers([
      ...members,
      { isUser: 1, userId: "", userName: "", hasPaid: 0 },
    ]);
  };

  const updateMember = (index, field, value) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const removeMember = (index) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-6 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black tracking-tight">
              {subscription ? t("editSubscription") : t("newSubscription")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label
                htmlFor="sub-name"
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
              >
                {t("name")}
              </label>
              <div className="relative">
                <Banknote
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <input
                  id="sub-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="e.g. Spotify"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="sub-price"
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
              >
                {t("basePrice")}
              </label>
              <div className="relative">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                  €
                </span>
                <input
                  id="sub-price"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="23.76"
                  type="text"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="sub-start"
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
              >
                {t("billingPeriodStart")}
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <input
                  id="sub-start"
                  required
                  type="date"
                  value={billingPeriodStart}
                  onChange={(e) => setBillingPeriodStart(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="sub-end"
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
              >
                {t("billingPeriodEnd")}
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <input
                  id="sub-end"
                  required
                  type="date"
                  value={billingPeriodEnd}
                  onChange={(e) => setBillingPeriodEnd(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Users size={18} className="text-primary" />
                {t("members")}
              </h3>
              <button
                type="button"
                onClick={addMember}
                className="text-xs font-bold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity flex items-center gap-1"
              >
                <Plus size={14} />
                {t("addMember")}
              </button>
            </div>

            <div className="space-y-3">
              {members.map((member, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-muted/30 border border-border rounded-2xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member.isUser === 1}
                          onChange={(e) =>
                            updateMember(
                              idx,
                              "isUser",
                              e.target.checked ? 1 : 0,
                            )
                          }
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                        />
                        <span className="text-xs font-medium">
                          {t("isUser")}
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member.hasPaid === 1}
                          onChange={(e) =>
                            updateMember(
                              idx,
                              "hasPaid",
                              e.target.checked ? 1 : 0,
                            )
                          }
                          className="w-4 h-4 rounded border-border text-green-500 focus:ring-green-500/20"
                        />
                        <span className="text-xs font-medium">
                          {t("hasPaid")}
                        </span>
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMember(idx)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {member.isUser === 1 ? (
                      <select
                        required
                        value={member.userId}
                        onChange={(e) =>
                          updateMember(idx, "userId", e.target.value)
                        }
                        className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">{t("selectUser")}</option>
                        {allUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.displayName} ({u.email})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required
                        value={member.userName}
                        onChange={(e) =>
                          updateMember(idx, "userName", e.target.value)
                        }
                        placeholder={t("userName")}
                        className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    )}
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-center py-4 text-sm text-muted-foreground">
                  Keine Mitglieder hinzugefügt.
                </p>
              )}
            </div>
          </div>
        </form>

        <div className="px-6 py-6 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-4 shrink-0">
          {subscription ? (
            <SubmitButton
              type="button"
              onClick={handleDelete}
              icon={<Trash2 size={18} />}
              label={t("deleteSubscription")}
              showInlineError={false}
              successDuration={0}
              className="flex items-center gap-2 px-5 py-2.5 text-destructive font-medium hover:bg-destructive/10 rounded-xl"
            />
          ) : (
            <div />
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium hover:bg-muted rounded-xl transition-colors"
            >
              {tc("cancel")}
            </button>
            <SubmitButton
              type="submit"
              onClick={handleSubmit}
              icon={<Check size={18} />}
              label={tc("save")}
              successDuration={0}
              showInlineError={false}
              className="flex items-center gap-2 px-6 py-2.5 shadow-lg shadow-primary/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
