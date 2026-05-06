"use client";

import { useState } from "react";
import SaveButton from "@/components/SaveButton";
import { Star } from "lucide-react";

export default function ReviewForm({ placeId, onAdded }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/discover/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, rating, comment }),
      });

      if (res.ok) {
        setComment("");
        setRating(5);
        onAdded();
      } else {
        const data = await res.json();
        setError(data.error || "Fehler beim Speichern.");
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-muted/30 border border-border rounded-2xl space-y-4"
    >
      <h3 className="font-bold text-sm">Eigene Bewertung schreiben</h3>

      {error && <div className="text-xs text-destructive">{error}</div>}

      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`p-1 transition-colors ${rating >= star ? "text-orange-500" : "text-muted-foreground/30"}`}
          >
            <Star size={24} fill={rating >= star ? "currentColor" : "none"} />
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
          Kommentar
        </label>
        <textarea
          className="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm min-h-[100px] focus:ring-2 ring-primary/20 outline-none"
          placeholder="Wie war dein Besuch?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <SaveButton loading={saving} type="submit">
          Bewertung senden
        </SaveButton>
      </div>
    </form>
  );
}
