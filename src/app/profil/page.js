import { getProfileData, saveProfile } from "@/app/profil/actions";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";

const fields = [
  { name: "discordHandle",  label: "Discord",   placeholder: "nutzername" },
  { name: "fluxerHandle",   label: "Fluxer",    placeholder: "nutzername#1234" },
  { name: "matrixHandle",   label: "Matrix",    placeholder: "nutzername:server.de" },
  { name: "signalNumber",   label: "Signal",    placeholder: "+49..." },
  { name: "whatsappNumber", label: "WhatsApp",  placeholder: "+49..." },
];

export default async function ProfilPage() {
  const session = await getSession();
  const data = await getProfileData();
  if (!data) redirect("/login");

  const { user, contact } = data;

  return (
    <AppShell user={user} session={session}>
      <div className="max-w-lg mx-auto w-full px-6 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4 font-medium">
          Profil
        </p>
        <h1 className="text-4xl font-light text-foreground mb-8">
          {user.displayName}
        </h1>

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

          {fields.map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium mb-1 text-foreground">{label}</label>
              <input
                name={name}
                defaultValue={contact?.[name] ?? ""}
                placeholder={placeholder}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Speichern
          </button>
        </form>
      </div>
    </AppShell>
  );
}
