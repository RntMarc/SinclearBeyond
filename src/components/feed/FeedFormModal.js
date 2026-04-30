"use client";

import { Music, Newspaper, Play, SquarePlay, X } from "lucide-react";
import { useEffect, useState } from "react";
import VisibilityToggle from "@/components/profile/VisibilityToggle";
import SaveButton from "@/components/SaveButton";

const CATEGORIES = [
  { id: "music", label: "Musik", icon: Music },
  { id: "video", label: "Videos", icon: Play },
  { id: "news", label: "News", icon: Newspaper },
  { id: "other", label: "Sonstiges", icon: SquarePlay },
];

export default function FeedFormModal({ post, onClose, onSuccess }) {
  const [isClosing, setIsClosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState(post?.category || "music");
  const [form, setForm] = useState({
    content: post?.content || "",
    visibility: post?.visibility || 1,
    // Music
    artist: post?.artist || "",
    title: post?.title || "",
    spotifyUrl: post?.spotifyUrl || "",
    youtubeMusicUrl: post?.youtubeMusicUrl || "",
    soundcloudUrl: post?.soundcloudUrl || "",
    // Video
    videoUrl: post?.videoUrl || "",
    videoPlatform: post?.videoPlatform || "",
    // News
    newsTitle: post?.newsTitle || "",
    newsSite: post?.newsSite || "",
    newsUrl: post?.newsUrl || "",
    // Other
    otherTitle: post?.otherTitle || "",
    otherUrl: post?.otherUrl || "",
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError("");

    // Validation
    if (category === "music") {
      if (!form.artist || !form.title) {
        setError("Künstler und Titel sind erforderlich.");
        return;
      }
      if (!form.spotifyUrl && !form.youtubeMusicUrl && !form.soundcloudUrl) {
        setError("Mindestens ein Link zu einer Plattform ist erforderlich.");
        return;
      }
    } else if (category === "video") {
      if (!form.videoUrl || !form.videoPlatform) {
        setError("Video-Link und Plattform sind erforderlich.");
        return;
      }
    } else if (category === "news") {
      if (!form.newsTitle || !form.newsSite || !form.newsUrl) {
        setError("Titel, Nachrichtenseite und Link sind erforderlich.");
        return;
      }
    } else if (category === "other") {
      if (!form.otherTitle || !form.otherUrl) {
        setError("Titel und Link sind erforderlich.");
        return;
      }
    }

    setSaving(true);
    try {
      const url = post ? `/api/feed/${post.id}` : "/api/feed";
      const method = post ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, category }),
      });

      if (res.ok) {
        onSuccess(post ? "Beitrag aktualisiert" : "Beitrag geteilt");
      } else {
        const data = await res.json();
        setError(data.error || "Ein Fehler ist aufgetreten.");
      }
    } catch (_err) {
      setError("Verbindungsfehler.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      <div
        className={`relative w-full max-w-xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 max-h-[90vh] ${
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-semibold">
              {post ? "Beitrag bearbeiten" : "Inhalt empfehlen"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Teile etwas Interessantes mit anderen.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-8"
        >
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Category Selector */}
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1">
              Kategorie wählen
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                    category === cat.id
                      ? "bg-primary/5 border-primary text-primary shadow-sm"
                      : "bg-sidebar-accent/30 border-sidebar-border text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  }`}
                >
                  <cat.icon size={20} />
                  <span className="text-xs font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields Based on Category */}
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {category === "music" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Künstler"
                    name="artist"
                    value={form.artist}
                    onChange={handleChange}
                    placeholder="z.B. Pink Floyd"
                    required
                  />
                  <FormField
                    label="Titel"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="z.B. Wish You Were Here"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <FormField
                    label="Spotify Link"
                    name="spotifyUrl"
                    value={form.spotifyUrl}
                    onChange={handleChange}
                    placeholder="https://open.spotify.com/..."
                  />
                  <FormField
                    label="YouTube Music Link"
                    name="youtubeMusicUrl"
                    value={form.youtubeMusicUrl}
                    onChange={handleChange}
                    placeholder="https://music.youtube.com/..."
                  />
                  <FormField
                    label="SoundCloud Link"
                    name="soundcloudUrl"
                    value={form.soundcloudUrl}
                    onChange={handleChange}
                    placeholder="https://soundcloud.com/..."
                  />
                </div>
              </>
            )}

            {category === "video" && (
              <>
                <FormField
                  label="Video Link"
                  name="videoUrl"
                  value={form.videoUrl}
                  onChange={handleChange}
                  placeholder="https://youtube.com/watch?v=..."
                  required
                />
                <FormField
                  label="Plattform"
                  name="videoPlatform"
                  value={form.videoPlatform}
                  onChange={handleChange}
                  placeholder="z.B. YouTube, Twitch, PeerTube"
                  required
                />
              </>
            )}

            {category === "news" && (
              <>
                <FormField
                  label="Titel des Beitrags"
                  name="newsTitle"
                  value={form.newsTitle}
                  onChange={handleChange}
                  placeholder="z.B. Neue Entdeckung im Weltraum"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Nachrichtenseite / Blog"
                    name="newsSite"
                    value={form.newsSite}
                    onChange={handleChange}
                    placeholder="z.B. Golem, Heise, BBC"
                    required
                  />
                  <FormField
                    label="Link"
                    name="newsUrl"
                    value={form.newsUrl}
                    onChange={handleChange}
                    placeholder="https://..."
                    required
                  />
                </div>
              </>
            )}

            {category === "other" && (
              <>
                <FormField
                  label="Titel"
                  name="otherTitle"
                  value={form.otherTitle}
                  onChange={handleChange}
                  placeholder="z.B. Cooles Open Source Projekt"
                  required
                />
                <FormField
                  label="Link"
                  name="otherUrl"
                  value={form.otherUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  required
                />
              </>
            )}

            {/* Common Comment Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="feed-content"
                className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1"
              >
                Dein Kommentar (optional)
              </label>
              <textarea
                id="feed-content"
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Warum empfiehlst du diesen Inhalt?"
                rows={3}
                className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            {/* Visibility Toggle */}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sichtbarkeit</p>
                <p className="text-xs text-muted-foreground">
                  Wer darf diesen Beitrag sehen?
                </p>
              </div>
              <VisibilityToggle
                value={form.visibility}
                onChange={(v) =>
                  setForm((prev) => ({ ...prev, visibility: v }))
                }
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Abbrechen
          </button>
          <SaveButton loading={saving} onClick={handleSubmit}>
            {post ? "Aktualisieren" : "Teilen"}
          </SaveButton>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, name, value, onChange, placeholder, required }) {
  const id = `field-${name}`;
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1"
      >
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      <input
        id={id}
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />
    </div>
  );
}
