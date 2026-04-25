"use client";
import { useState } from "react";
import { saveProfile } from "@/app/profil/actions";
import ContactField from "@/components/profile/ContactField";

const FIELDS = [
  { name: "discordHandle",  visKey: "discordVisibility",  label: "Discord",  placeholder: "nutzername" },
  { name: "fluxerHandle",   visKey: "fluxerVisibility",   label: "Fluxer",   placeholder: "nutzername#1234" },
  { name: "matrixHandle",   visKey: "matrixVisibility",   label: "Matrix",   placeholder: "nutzername:server.de" },
  { name: "signalNumber",   visKey: "signalVisibility",   label: "Signal",   placeholder: "+49..." },
  { name: "whatsappNumber", visKey: "whatsappVisibility", label: "WhatsApp", placeholder: "+49..." },
];

export default function ProfilForm({ user, contact }) {
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
    <form action={saveProfile} className="space-y-5">
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

      {FIELDS.map(({ name, label, placeholder }) => {
        const visKey = `${name.replace("Handle", "").replace("Number", "")}Visibility`;
        // discordHandle → discordVisibility, signalNumber → signalVisibility
        const resolvedVisKey = (() => {
          const base = name
            .replace("Handle", "")
            .replace("Number", "");
          return `${base}Visibility`;
        })();
        return (
          <ContactField
            key={name}
            name={name}
            label={label}
            placeholder={placeholder}
            value={values[name]}
            onChange={(v) => setValues((prev) => ({ ...prev, [name]: v }))}
            visibility={visibility[resolvedVisKey]}
            onVisibilityChange={(v) =>
              setVisibility((prev) => ({ ...prev, [resolvedVisKey]: v }))
            }
          />
        );
      })}

      <button
        type="submit"
        className="w-full rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Speichern
      </button>
    </form>
  );
}
