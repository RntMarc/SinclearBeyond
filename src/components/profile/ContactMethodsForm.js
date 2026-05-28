"use client";

import { useTranslations } from "next-intl";
import ContactField from "@/components/profile/ContactField";

export default function ContactMethodsForm({
  user,
  values,
  setValues,
  visibility,
  setVisibility,
}) {
  const tFields = useTranslations("Settings.profile.fields");

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

  return (
    <div className="space-y-5">
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
          disabled={
            (name === "discordHandle" && !!user?.discordId) ||
            name === "matrixHandle"
          }
        />
      ))}
    </div>
  );
}
