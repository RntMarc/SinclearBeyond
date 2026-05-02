"use client";

import { AlertCircle, Check, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import SaveButton from "@/components/SaveButton";
import {
  requestEmailChangeOtp,
  verifyEmailChangeOtp,
} from "@/lib/profile/emailChange";

export default function EmailChangeForm({ currentEmail }) {
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (newEmail === currentEmail) {
      setError("Das ist bereits deine aktuelle E-Mail-Adresse.");
      setLoading(false);
      return;
    }

    const res = await requestEmailChangeOtp(newEmail);
    if (res.ok) {
      setStep(2);
    } else {
      setError(res.error || "Fehler beim Senden des Codes.");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await verifyEmailChangeOtp(newEmail, otp);
    if (res.ok) {
      setSuccess("E-Mail-Adresse erfolgreich geändert.");
      setStep(1);
      setNewEmail("");
      setOtp("");
      // Force reload to update session if needed (though session is in cookie)
      window.location.reload();
    } else {
      setError(res.error || "Code ungültig.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-sidebar border border-sidebar-border rounded-2xl p-8">
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
        <Mail size={20} className="text-primary" />
        E-Mail-Adresse ändern
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Aktuell:{" "}
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

      {step === 1
        ? <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label
                htmlFor="newEmail"
                className="block text-sm font-medium mb-1 text-foreground"
              >
                Neue E-Mail-Adresse
              </label>
              <input
                id="newEmail"
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                placeholder="neu@beispiel.de"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Code anfordern
            </button>
          </form>
        : <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium mb-1 text-foreground"
              >
                Bestätigungscode (an {newEmail})
              </label>
              <input
                id="otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-center tracking-widest font-mono"
                placeholder="123456"
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 bg-sidebar-accent text-sidebar-accent-foreground rounded-lg text-sm font-medium hover:bg-sidebar-accent/80 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                E-Mail bestätigen
              </button>
            </div>
          </form>}
    </div>
  );
}
