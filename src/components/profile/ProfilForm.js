"use client";
import { useActionState, useState } from "react";
import { saveProfile } from "@/app/profil/actions";
import ContactField from "@/components/profile/ContactField";
import SaveButton from "@/components/SaveButton";

const FIELDS = [
  { name: "discordHandle",  visKey: "discordVisibility",  label: "Discord",  placeholder: "nutzername" },
  { name: "fluxerHandle",   visKey: "fluxerVisibility",   label: "Fluxer",   placeholder: "nutzername#1234" },
  { name: "matrixHandle",   visKey: "matrixVisibility",   label: "Matrix",   placeholder: "nutzername:server.de" },
  { name: "signalNumber",   visKey: "signalVisibility",   label: "Signal",   placeholder: "+49..." },
  { name: "whatsappNumber", visKey: "whatsappVisibility", label: "WhatsApp", placeholder: "+49..." },
];

export default function ProfilForm({ user, contact }) {
  const [state, action, isPending] = useActionState(saveProfile, null);

  const [values, setValues] = useState({
    discordHandle:  contact?.discordHandle  ?? "",
    fluxerHandle:   contact?.fluxerHandle   ?? "",
    matrixHandle:   contact?.matrixHandle   ?? "",
    signalNumber:   contact?.signalNumber   ?? "",
    whatsappNumber: contact?.whatsappNumber ?? "",
  });

  const [visibility, setVisibility] = useState({
    discordVisibility:  contact?.discordVisibility  ?? 1,
    fluxerVisibility:   contact?.fluxerVisibility   ?? 1,
    matrixVisibility:   contact?.matrixVisibility   ?? 1,
    signalVisibility:   contact?.signalVisibility   ?? 1,
    whatsappVisibility: contact?.whatsappVisibility ?? 1,
  });

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">Name</label>
        <input
          name="displayName"
          defaultValue={user.displayName}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
        />
      </div>

      <hr className="border-border" />
      <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Kontakt</p>

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
          onVisibilityChange={(v) => setVisibility((prev) => ({ ...prev, [visKey]: v }))}
        />
      ))}

      <SaveButton pending={isPending} state={state} />
    </form>
  );
}
