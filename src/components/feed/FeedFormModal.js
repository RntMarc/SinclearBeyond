"use client";

import { Music, Newspaper, Play, SquarePlay, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import VisibilityToggle from "@/components/profile/VisibilityToggle";
import SaveButton from "@/components/SaveButton";

export default function FeedFormModal({ post, onClose, onSuccess }) {
  const t = useTranslations("Feed.form");
  const tFeed = useTranslations("Feed");
  const tCommon = useTranslations("Common");

  const CATEGORIES = [
    { id: "music", label: tFeed("categories.music"), icon: Music },
    { id: "video", label: tFeed("categories.video"), icon: Play },
    { id: "news", label: tFeed("categories.news"), icon: Newspaper },
    { id: "other", label: tFeed("categories.other"), icon: SquarePlay },
  ];
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
    youtubeUrl: post?.youtubeUrl || "",
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
        setError(t("errors.music"));
        return;
      }
      if (
        !form.spotifyUrl &&
        !form.youtubeMusicUrl &&
        !form.youtubeUrl &&
        !form.soundcloudUrl
      ) {
        setError(t("errors.musicLink"));
        return;
      }

      // URL Validations
      if (
        form.spotifyUrl &&
        !form.spotifyUrl.match(
          /^(https?:\/\/)?(open\.spotify\.com\/|spotify:)(track|album|playlist|artist).+$/,
        )
      ) {
        setError(t("errors.invalidUrl"));
        return;
      }
      if (
        form.youtubeMusicUrl &&
        !form.youtubeMusicUrl.match(
          /^(https?:\/\/)?(music\.youtube\.com\/)(watch\?v=|playlist\?list=).+$/,
        )
      ) {
        setError(t("errors.invalidUrl"));
        return;
      }
      if (
        form.youtubeUrl &&
        !form.youtubeUrl.match(
          /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/watch\?v=|youtu\.be\/).+$/,
        )
      ) {
        setError(t("errors.invalidUrl"));
        return;
      }
      if (
        form.soundcloudUrl &&
        !form.soundcloudUrl.match(/^(https?:\/\/)?(soundcloud\.com\/).+$/)
      ) {
        setError(t("errors.invalidUrl"));
        return;
      }
    } else if (category === "video") {
      if (!form.videoUrl || !form.videoPlatform) {
        setError(t("errors.video"));
        return;
      }
    } else if (category === "news") {
      if (!form.newsTitle || !form.newsSite || !form.newsUrl) {
        setError(t("errors.news"));
        return;
      }
    } else if (category === "other") {
      if (!form.otherTitle || !form.otherUrl) {
        setError(t("errors.other"));
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
        onSuccess(post ? t("successUpdate") : t("successShare"));
      } else {
        const data = await res.json();
        setError(data.error || t("errors.generic"));
      }
    } catch (_err) {
      setError(t("errors.connection"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={handleClose} />

      <div
        className={`relative w-full max-w-xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 max-h-[90vh] ${
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-semibold">
              {post ? t("modalTitleEdit") : t("modalTitleNew")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("modalSubtitle")}
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
              {t("categoryLabel")}
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
                    label={t("fields.artist")}
                    name="artist"
                    value={form.artist}
                    onChange={handleChange}
                    placeholder={t("placeholders.artist")}
                    required
                  />
                  <FormField
                    label={t("fields.title")}
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder={t("placeholders.songTitle")}
                    required
                  />
                </div>
                <div className="space-y-4">
                  <FormField
                    label={t("fields.spotifyLink")}
                    name="spotifyUrl"
                    value={form.spotifyUrl}
                    onChange={handleChange}
                    placeholder={t("placeholders.spotify")}
                  />
                  <FormField
                    label={t("fields.ytMusicLink")}
                    name="youtubeMusicUrl"
                    value={form.youtubeMusicUrl}
                    onChange={handleChange}
                    placeholder={t("placeholders.ytMusic")}
                  />
                  <FormField
                    label={t("fields.youtubeLink")}
                    name="youtubeUrl"
                    value={form.youtubeUrl}
                    onChange={handleChange}
                    placeholder={t("placeholders.video")}
                  />
                  <FormField
                    label={t("fields.soundcloudLink")}
                    name="soundcloudUrl"
                    value={form.soundcloudUrl}
                    onChange={handleChange}
                    placeholder={t("placeholders.soundcloud")}
                  />
                </div>
              </>
            )}

            {category === "video" && (
              <>
                <FormField
                  label={t("fields.videoLink")}
                  name="videoUrl"
                  value={form.videoUrl}
                  onChange={handleChange}
                  placeholder={t("placeholders.video")}
                  required
                />
                <FormField
                  label={t("fields.platform")}
                  name="videoPlatform"
                  value={form.videoPlatform}
                  onChange={handleChange}
                  placeholder={t("placeholders.platform")}
                  required
                />
              </>
            )}

            {category === "news" && (
              <>
                <FormField
                  label={t("fields.newsTitle")}
                  name="newsTitle"
                  value={form.newsTitle}
                  onChange={handleChange}
                  placeholder={t("placeholders.newsTitle")}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label={t("fields.newsSite")}
                    name="newsSite"
                    value={form.newsSite}
                    onChange={handleChange}
                    placeholder={t("placeholders.newsSite")}
                    required
                  />
                  <FormField
                    label={t("fields.newsLink")}
                    name="newsUrl"
                    value={form.newsUrl}
                    onChange={handleChange}
                    placeholder={t("placeholders.link")}
                    required
                  />
                </div>
              </>
            )}

            {category === "other" && (
              <>
                <FormField
                  label={t("fields.otherTitle")}
                  name="otherTitle"
                  value={form.otherTitle}
                  onChange={handleChange}
                  placeholder={t("placeholders.otherTitle")}
                  required
                />
                <FormField
                  label={t("fields.otherLink")}
                  name="otherUrl"
                  value={form.otherUrl}
                  onChange={handleChange}
                  placeholder={t("placeholders.link")}
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
                {t("commentLabel")}
              </label>
              <textarea
                id="feed-content"
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder={t("commentPlaceholder")}
                rows={3}
                className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            {/* Visibility Toggle */}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t("visibilityLabel")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("visibilityDesc")}
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
            {tCommon("cancel")}
          </button>
          <SaveButton loading={saving} onClick={handleSubmit}>
            {post ? t("update") : t("share")}
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
