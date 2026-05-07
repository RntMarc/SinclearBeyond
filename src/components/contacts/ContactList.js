"use client";
import { ChevronRight, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import ContactModal from "./ContactModal";

export default function ContactList({ initialContacts }) {
  const t = useTranslations("Common");
  const [selectedContact, setSelectedContact] = useState(null);

  if (!initialContacts || initialContacts.length === 0) {
    return (
      <div className="bg-sidebar rounded-xl border border-sidebar-border p-8 text-center">
        <p className="text-muted-foreground">{t("noEntries")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3">
        {initialContacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => setSelectedContact(contact)}
            className="flex items-center justify-between p-4 bg-sidebar hover:bg-sidebar-accent border border-sidebar-border rounded-xl transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                {contact.displayName?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {contact.displayName}
                  </span>
                  {contact.isCloseFriend && (
                    <Heart size={14} className="fill-primary text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{contact.email}</p>
              </div>
            </div>
            <ChevronRight
              size={18}
              className="text-muted-foreground group-hover:translate-x-1 transition-transform"
            />
          </button>
        ))}
      </div>

      {selectedContact && (
        <ContactModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </>
  );
}
