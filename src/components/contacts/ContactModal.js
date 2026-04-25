"use client";
import { X, Mail, MessageSquare, Phone, Heart } from "lucide-react";

export default function ContactModal({ contact, onClose }) {
  const info = contact.contactInfo || {};

  const hasDetails = Object.values(info).some(v => v !== null);

  const detailFields = [
    { label: "Discord",  value: info.discordHandle,  icon: MessageSquare },
    { label: "Fluxer",   value: info.fluxerHandle,   icon: MessageSquare },
    { label: "Matrix",   value: info.matrixHandle,   icon: MessageSquare },
    { label: "Signal",   value: info.signalNumber,   icon: Phone },
    { label: "WhatsApp", value: info.whatsappNumber, icon: Phone },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-sidebar border border-sidebar-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-24 bg-primary/10 flex items-end px-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-foreground transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
             <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-semibold shadow-lg border-4 border-sidebar">
                {contact.displayName?.[0]?.toUpperCase() || "?"}
             </div>
             <div className="mb-1">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {contact.displayName}
                  {contact.isCloseFriend && (
                    <Heart size={16} className="fill-primary text-primary" />
                  )}
                </h2>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Mitglied</p>
             </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-sidebar-border pb-2">
              Kontaktinformationen
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">E-Mail</p>
                  <p className="text-foreground">{contact.email}</p>
                </div>
              </div>

              {detailFields.map(({ label, value, icon: Icon }) => value && (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">{label}</p>
                    <p className="text-foreground">{value}</p>
                  </div>
                </div>
              ))}

              {!hasDetails && (
                <p className="text-sm text-muted-foreground italic py-2">
                  Keine weiteren Kontaktinformationen freigegeben.
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-sidebar-accent hover:bg-sidebar-accent/80 text-foreground rounded-xl font-medium transition-colors border border-sidebar-border"
          >
            Schließen
          </button>
        </div>
      </div>
      {/* Overlay click to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
