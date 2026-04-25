import { getProfileData, saveProfile } from "@/app/(protected)/profil/actions";
import { redirect } from "next/navigation";

const fields = [
  { name: "discordHandle",  label: "Discord",   placeholder: "nutzername" },
  { name: "fluxerHandle",   label: "Fluxer",    placeholder: "nutzername#1234" },
  { name: "matrixHandle",   label: "Matrix",    placeholder: "nutzername:server.de" },
  { name: "signalNumber",   label: "Signal",    placeholder: "+49..." },
  { name: "whatsappNumber", label: "WhatsApp",  placeholder: "+49..." },
];

export default async function ProfilPage() {
  const data = await getProfileData();
  if (!data) redirect("/login");

  const { user, contact } = data;

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-xl font-semibold mb-6">Profil</h1>

      <form action={saveProfile} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            name="displayName"
            defaultValue={user.displayName}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <hr className="border-border" />
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Kontakt</p>

        {fields.map(({ name, label, placeholder }) => (
          <div key={name}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input
              name={name}
              defaultValue={contact?.[name] ?? ""}
              placeholder={placeholder}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}

        <button
          type="submit"
          className="w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Speichern
        </button>
      </form>
    </div>
  );
}
