"use client";
import { useActionState, useState } from "react";
import ContactField from "@/components/profile/ContactField";
import VisibilityToggle from "@/components/profile/VisibilityToggle";
import SaveButton from "@/components/SaveButton";
import { saveProfile } from "@/lib/profile/profile";

const FIELDS = [
  {
    name: "discordHandle",
    visKey: "discordVisibility",
    label: "Discord",
    placeholder: "nutzername",
  },
  {
    name: "fluxerHandle",
    visKey: "fluxerVisibility",
    label: "Fluxer",
    placeholder: "nutzername#1234",
  },
  {
    name: "matrixHandle",
    visKey: "matrixVisibility",
    label: "Matrix",
    placeholder: "nutzername:server.de",
  },
  {
    name: "signalNumber",
    visKey: "signalVisibility",
    label: "Signal",
    placeholder: "+49...",
  },
  {
    name: "whatsappNumber",
    visKey: "whatsappVisibility",
    label: "WhatsApp",
    placeholder: "+49...",
  },
];

export default function ProfilForm({ user, contact }) {
  const [state, action, isPending] = useActionState(saveProfile, null);

  const [values, setValues] = useState({
    discordHandle: contact?.discordHandle ?? "",
    fluxerHandle: contact?.fluxerHandle ?? "",
    matrixHandle: contact?.matrixHandle ?? "",
    signalNumber: contact?.signalNumber ?? "",
    whatsappNumber: contact?.whatsappNumber ?? "",
  });

  const [visibility, setVisibility] = useState({
    birthdayVisibility: user?.birthdayVisibility ?? 1,
    discordVisibility: contact?.discordVisibility ?? 1,
    fluxerVisibility: contact?.fluxerVisibility ?? 1,
    matrixVisibility: contact?.matrixVisibility ?? 1,
    signalVisibility: contact?.signalVisibility ?? 1,
    whatsappVisibility: contact?.whatsappVisibility ?? 1,
  });

  const birthdayValue = user.birthday
    ? new Date(user.birthday).toISOString().split("T")[0]
    : "";

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">
          Name
        </label>
        <input
          name="displayName"
          defaultValue={user.displayName}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">
          Geburtsdatum
        </label>
        <div className="flex gap-2 items-center">
          <input
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

      <hr className="border-border" />
      <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
        Kontakt
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
        />
      ))}

      <SaveButton pending={isPending} state={state} />
    </form>
  );
}
