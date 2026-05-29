"use client";

import { useTranslations } from "next-intl";
import ContactField from "@/components/profile/ContactField";

export default function SocialMediaFields({
  values,
  setValues,
  visibility,
  setVisibility,
}) {
  const tFields = useTranslations("Settings.profile.fields");

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

  return (
    <div className="space-y-5">
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
    </div>
  );
}
