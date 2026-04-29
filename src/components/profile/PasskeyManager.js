"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function PasskeyManager() {
  const [passkeys, setPasskeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempAttestation, setTempAttestation] = useState(null);
  const [newName, setNewName] = useState("Mein Passkey");

  useEffect(() => {
    fetchPasskeys();
  }, []);

  async function fetchPasskeys() {
    try {
      const res = await fetch("/api/auth/passkey/list");
      if (res.ok) {
        const data = await res.json();
        setPasskeys(data);
      }
    } catch (err) {
      console.error("Fehler beim Laden der Passkeys", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPasskey() {
    setError("");
    setAdding(true);

    try {
      const optionsRes = await fetch("/api/auth/passkey/register/options", {
        method: "POST",
      });
      if (!optionsRes.ok)
        throw new Error("Konnte Registrierungsoptionen nicht laden.");
      const options = await optionsRes.json();

      const attestation = await startRegistration({ optionsJSON: options });

      setTempAttestation(attestation);
      setShowNameModal(true);
      setNewName("Mein Passkey");
    } catch (err) {
      console.error(err);
      if (err.name !== "NotAllowedError") {
        setError(err.message || "Fehler beim Hinzufügen des Passkeys.");
      }
    } finally {
      setAdding(false);
    }
  }

  async function confirmAddPasskey() {
    if (!tempAttestation) return;
    setAdding(true);
    setError("");

    try {
      const verifyRes = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: tempAttestation, name: newName }),
      });

      if (verifyRes.ok) {
        setShowNameModal(false);
        setTempAttestation(null);
        fetchPasskeys();
      } else {
        const data = await verifyRes.json();
        throw new Error(data.error || "Verifizierung fehlgeschlagen.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Fehler beim Hinzufügen des Passkeys.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Diesen Passkey wirklich löschen?")) return;

    try {
      const res = await fetch("/api/auth/passkey/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setPasskeys(passkeys.filter((pk) => pk.id !== id));
      }
    } catch (err) {
      console.error("Fehler beim Löschen", err);
    }
  }

  return (
    <div className="mt-10 pt-10 border-t border-border">
      <h2 className="text-xl font-light text-foreground mb-6 flex items-center gap-2">
        <Fingerprint className="w-5 h-5 text-primary" />
        Login & Passkeys
      </h2>

      <p className="text-sm text-muted-foreground mb-6">
        Nutze Passkeys, um dich ohne E-Mail-Code sicher einzuloggen. Du kannst
        mehrere Passkeys für verschiedene Geräte hinterlegen.
      </p>

      {error && <p className="text-destructive text-sm mb-4">{error}</p>}

      <div className="space-y-3 mb-6">
        {loading
          ? <p className="text-sm text-muted-foreground">Wird geladen...</p>
          : passkeys.length === 0
            ? <p className="text-sm text-muted-foreground italic">
                Noch keine Passkeys hinterlegt.
              </p>
            : passkeys.map((pk) => (
                <div
                  key={pk.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-card border border-border group"
                >
                  <div>
                    <p className="font-medium text-foreground">{pk.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Erstellt am {new Date(pk.createdAt).toLocaleDateString()}
                      {pk.lastUsedAt &&
                        ` • Zuletzt verwendet: ${new Date(pk.lastUsedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(pk.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
      </div>

      <button
        type="button"
        onClick={handleAddPasskey}
        disabled={adding}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
      >
        <Plus className="w-4 h-4" />
        {adding ? "Wird hinzugefügt..." : "Passkey hinzufügen"}
      </button>

      {/* Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Passkey benennen</h3>
              <button
                onClick={() => setShowNameModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Gib diesem Passkey einen Namen, damit du ihn später wiedererkennst
              (z.B. "Mein iPhone").
            </p>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-background border border-border mb-6 focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNameModal(false)}
                className="flex-1 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-accent"
              >
                Abbrechen
              </button>
              <button
                onClick={confirmAddPasskey}
                disabled={adding || !newName.trim()}
                className="flex-1 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
