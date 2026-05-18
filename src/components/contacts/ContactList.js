"use client";
import { ChevronRight, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import ContactModal from "./ContactModal";

export default function ContactList({
  initialContacts,
  variant = "list",
  showCloseFriendIcon = true,
}) {
  const t = useTranslations("Common");
  const [selectedContact, setSelectedContact] = useState(null);

  if (!initialContacts || initialContacts.length === 0) {
    return (
      <div className="bg-sidebar rounded-xl border border-sidebar-border p-8 text-center">
        <p className="text-muted-foreground">{t("noEntries")}</p>
      </div>
    );
  }

  const isGrid = variant === "grid";

  return (
    <>
      <div
        className={
          isGrid ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "grid gap-3"
        }
      >
        {initialContacts.map((contact) => (
          <button
            key={contact.id}
            type="button"
            onClick={() => setSelectedContact(contact)}
            className={`flex items-center justify-between p-4 bg-sidebar hover:bg-sidebar-accent border border-sidebar-border rounded-xl transition-all group text-left ${isGrid ? "bg-background" : ""}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar src={contact.image} displayName={contact.displayName} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">
                    {contact.displayName}
                  </span>
                  {showCloseFriendIcon && contact.isCloseFriend && (
                    <Heart size={14} className="fill-primary text-primary" />
                  )}
                </div>
                {contact.email ? (
                  <p className="text-xs text-muted-foreground truncate">
                    {contact.email}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground/60 italic truncate">
                    {t("emailHidden")}
                  </p>
                )}
              </div>
            </div>
            {!isGrid && (
              <ChevronRight
                size={18}
                className="text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0"
              />
            )}
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
