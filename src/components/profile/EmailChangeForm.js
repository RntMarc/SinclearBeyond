"use client";

import { AlertCircle, Check, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import SubmitButton from "@/components/ui/SubmitButton";
import {
  requestEmailChangeOtp,
  verifyEmailChangeOtp,
} from "@/lib/profile/emailChange";

export default function EmailChangeForm({ currentEmail }) {
  const t = useTranslations("Settings.login");
  const tCommon = useTranslations("Common");
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newEmail === currentEmail) {
      setError(t("emailErrorSame"));
      return { ok: false, error: t("emailErrorSame") };
    }

    const res = await requestEmailChangeOtp(newEmail);
    if (res.ok) {
      setStep(2);
      return { ok: true };
    }
    setError(res.error || tCommon("error"));
    return { ok: false, error: res.error };
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    const res = await verifyEmailChangeOtp(newEmail, otp);
    if (res.ok) {
      setSuccess(t("emailSuccess"));
      setStep(1);
      setNewEmail("");
      setOtp("");
      window.location.reload();
      return { ok: true };
    }
    setError(res.error || "Code ungültig.");
    return { ok: false, error: res.error };
  };

  return (
    <div className="bg-sidebar border border-sidebar-border rounded-2xl p-8">
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
        <Mail size={20} className="text-primary" />
        {t("emailTitle")}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {t("currentEmail")}:{" "}
        <span className="text-foreground font-medium">{currentEmail}</span>
      </p>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 text-green-500 text-sm rounded-lg flex items-center gap-2">
          <Check size={16} />
          {success}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label
              htmlFor="newEmail"
              className="block text-sm font-medium mb-1 text-foreground"
            >
              {t("newEmailLabel")}
            </label>
            <input
              id="newEmail"
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              placeholder={t("newEmailPlaceholder")}
            />
          </div>
          <SubmitButton
            type="submit"
            onClick={handleRequestOtp}
            label={t("requestCode")}
            successToast={t("emailSuccess")}
            errorToast={tCommon("error")}
            showInlineError={!!error}
            state={error ? { ok: false, error } : null}
            className="w-full"
          />
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium mb-1 text-foreground"
            >
              {t("otpLabel")} (an {newEmail})
            </label>
            <input
              id="otp"
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-center tracking-widest font-mono"
              placeholder={t("otpPlaceholder")}
              maxLength={6}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 px-4 py-2 bg-sidebar-accent text-sidebar-accent-foreground rounded-lg text-sm font-medium hover:bg-sidebar-accent/80 transition-colors"
            >
              {tCommon("cancel")}
            </button>
            <SubmitButton
              type="submit"
              onClick={handleVerifyOtp}
              label={t("verifyEmail")}
              successToast={t("emailSuccess")}
              errorToast={tCommon("error")}
              showInlineError={!!error}
              state={error ? { ok: false, error } : null}
              className="flex-[2]"
            />
          </div>
        </form>
      )}
    </div>
  );
}
