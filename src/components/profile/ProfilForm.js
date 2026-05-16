"use client";
import { Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import ContactField from "@/components/profile/ContactField";
import VisibilityToggle from "@/components/profile/VisibilityToggle";
import SaveButton from "@/components/SaveButton";
import { formatBirthday } from "@/lib/dateUtils";
import { saveProfile } from "@/lib/profile/profile";

export default function ProfilForm({ user, contact, social }) {
  const t = useTranslations("Settings");
  const tFields = useTranslations("Settings.profile.fields");
  const [state, action, isPending] = useActionState(saveProfile, null);

  const FIELDS = [
    {
      name: "discordHandle",
      visKey: "discordVisibility",
      label: tFields("discord"),
      placeholder: tFields("discordPlaceholder"),
    },
    {
      name: "fluxerHandle",
      visKey: "fluxerVisibility",
      label: tFields("fluxer"),
      placeholder: tFields("fluxerPlaceholder"),
    },
    {
      name: "matrixHandle",
      visKey: "matrixVisibility",
      label: tFields("matrix"),
      placeholder: tFields("matrixPlaceholder"),
    },
    {
      name: "signalNumber",
      visKey: "signalVisibility",
      label: tFields("signal"),
      placeholder: tFields("phonePlaceholder"),
    },
    {
      name: "whatsappNumber",
      visKey: "whatsappVisibility",
      label: tFields("whatsapp"),
      placeholder: tFields("phonePlaceholder"),
    },
  ];

  const SOCIAL_FIELDS = [
    {
      name: "unsplashHandle",
      visKey: "unsplashVisibility",
      label: tFields("unsplash"),
      placeholder: tFields("socialPlaceholder"),
    },
    {
      name: "instagramHandle",
      visKey: "instagramVisibility",
      label: tFields("instagram"),
      placeholder: tFields("socialPlaceholder"),
    },
    {
      name: "mastodonHandle",
      visKey: "mastodonVisibility",
      label: tFields("mastodon"),
      placeholder: tFields("mastodonPlaceholder"),
    },
    {
      name: "pixelfedHandle",
      visKey: "pixelfedVisibility",
      label: tFields("pixelfed"),
      placeholder: tFields("mastodonPlaceholder"),
    },
    {
      name: "blueskyHandle",
      visKey: "blueskyVisibility",
      label: tFields("bluesky"),
      placeholder: tFields("blueskyPlaceholder"),
    },
    {
      name: "youtubeHandle",
      visKey: "youtubeVisibility",
      label: tFields("youtube"),
      placeholder: tFields("socialPlaceholder"),
    },
    {
      name: "twitchHandle",
      visKey: "twitchVisibility",
      label: tFields("twitch"),
      placeholder: tFields("socialPlaceholder"),
    },
  ];
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(user.image);
  const [removeImage, setRemoveImage] = useState(false);

  const [values, setValues] = useState({
    discordHandle: contact?.discordHandle ?? "",
    fluxerHandle: contact?.fluxerHandle ?? "",
    matrixHandle: contact?.matrixHandle ?? "",
    signalNumber: contact?.signalNumber ?? "",
    whatsappNumber: contact?.whatsappNumber ?? "",
    unsplashHandle: social?.unsplashHandle ?? "",
    instagramHandle: social?.instagramHandle ?? "",
    mastodonHandle: social?.mastodonHandle ?? "",
    pixelfedHandle: social?.pixelfedHandle ?? "",
    blueskyHandle: social?.blueskyHandle ?? "",
    youtubeHandle: social?.youtubeHandle ?? "",
    twitchHandle: social?.twitchHandle ?? "",
  });

  const [visibility, setVisibility] = useState({
    birthdayVisibility: user?.birthdayVisibility ?? 1,
    emailVisibility: user?.emailVisibility ?? 1,
    discordVisibility: contact?.discordVisibility ?? 1,
    fluxerVisibility: contact?.fluxerVisibility ?? 1,
    matrixVisibility: contact?.matrixVisibility ?? 1,
    signalVisibility: contact?.signalVisibility ?? 1,
    whatsappVisibility: contact?.whatsappVisibility ?? 1,
    unsplashVisibility: social?.unsplashVisibility ?? 1,
    instagramVisibility: social?.instagramVisibility ?? 1,
    mastodonVisibility: social?.mastodonVisibility ?? 1,
    pixelfedVisibility: social?.pixelfedVisibility ?? 1,
    blueskyVisibility: social?.blueskyVisibility ?? 1,
    youtubeVisibility: social?.youtubeVisibility ?? 1,
    twitchVisibility: social?.twitchVisibility ?? 1,
  });

  const birthdayValue = formatBirthday(user.birthday);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const err = urlParams.get("error");
    const succ = urlParams.get("success");

    if (err) {
      setError(
        err === "discord_already_linked"
          ? t("profile.discordErrorAlreadyLinked")
          : t("profile.discordErrorGeneric"),
      );
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (succ) {
      setSuccess(t("profile.discordSuccess"));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [t]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setRemoveImage(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setRemoveImage(true);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <form action={action} className="space-y-5">
      {error && <p className="text-destructive text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}

      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="relative group">
          <Avatar
            src={imagePreview}
            displayName={user.displayName}
            size="xl"
            className="!w-32 !h-32 border-4 border-sidebar-border"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-full"
          >
            <Upload size={24} />
            <span className="text-[10px] uppercase font-bold mt-1">
              {t("profile.changeImage")}
            </span>
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-medium px-3 py-1.5 bg-sidebar-accent rounded-lg border border-sidebar-border hover:bg-sidebar-accent/80 transition-colors"
          >
            {t("profile.uploadImage")}
          </button>
          {imagePreview && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="text-xs font-medium px-3 py-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              {t("profile.deleteImage")}
            </button>
          )}
        </div>

        <input
          type="file"
          id="image"
          name="image"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageChange}
        />
        <input type="hidden" name="removeImage" value={removeImage} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium mb-1 text-foreground"
          >
            {t("profile.nameLabel")}
          </label>
          <input
            id="displayName"
            name="displayName"
            defaultValue={user.displayName}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1 text-foreground"
          >
            {t("profile.emailLabel")}
          </label>
          <div className="flex gap-2 items-center">
            <input
              id="email"
              type="email"
              readOnly
              value={user.email}
              className="flex-1 rounded-lg border border-border bg-sidebar-accent px-3 py-2 text-sm focus:outline-none text-muted-foreground cursor-not-allowed"
            />
            <VisibilityToggle
              value={visibility.emailVisibility}
              onChange={(v) =>
                setVisibility((prev) => ({ ...prev, emailVisibility: v }))
              }
            />
            <input
              type="hidden"
              name="emailVisibility"
              value={visibility.emailVisibility}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="birthday"
            className="block text-sm font-medium mb-1 text-foreground"
          >
            {t("profile.birthdayLabel")}
          </label>
          <div className="flex gap-2 items-center">
            <input
              id="birthday"
              name="birthday"
              type="date"
              defaultValue={birthdayValue}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            />
            <VisibilityToggle
              value={visibility.birthdayVisibility}
              onChange={(v) =>
                setVisibility((prev) => ({ ...prev, birthdayVisibility: v }))
              }
            />
            <input
              type="hidden"
              name="birthdayVisibility"
              value={visibility.birthdayVisibility}
            />
          </div>
        </div>
      </div>

      <hr className="border-border" />
      <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
        {t("profile.contactTitle")}
      </p>

      {FIELDS.map(({ name, visKey, label, placeholder }) => (
        <ContactField
          key={name}
          name={name}
          visKey={visKey}
          label={label}
          placeholder={placeholder}
          value={values[name]}
          onChange={(v) => setValues((prev) => ({ ...prev, [name]: v }))}
          visibility={visibility[visKey]}
          onVisibilityChange={(v) =>
            setVisibility((prev) => ({ ...prev, [visKey]: v }))
          }
          disabled={name === "discordHandle" && !!user.discordId}
        />
      ))}

      {!user.discordId && (
        <button
          type="button"
          onClick={() => {
            window.location.href = "/api/auth/discord?mode=link";
          }}
          className="w-full px-4 py-2 rounded-lg border border-[#5865F2] text-[#5865F2] text-sm font-medium hover:bg-[#5865F2]/5 transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4 fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Discord Logo"
          >
            <title>Discord Logo</title>
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          {t("profile.discordLink")}
        </button>
      )}

      <hr className="border-border" />
      <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
        {t("profile.socialTitle")}
      </p>

      {SOCIAL_FIELDS.map(({ name, visKey, label, placeholder }) => (
        <ContactField
          key={name}
          name={name}
          visKey={visKey}
          label={label}
          placeholder={placeholder}
          value={values[name]}
          onChange={(v) => setValues((prev) => ({ ...prev, [name]: v }))}
          visibility={visibility[visKey]}
          onVisibilityChange={(v) =>
            setVisibility((prev) => ({ ...prev, [visKey]: v }))
          }
        />
      ))}

      <SaveButton pending={isPending} state={state} />
    </form>
  );
}
