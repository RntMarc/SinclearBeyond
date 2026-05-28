"use client";
import { Heart, Mail, MessageSquare, Phone, Send, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import BrandIcon from "@/components/BrandIcon";
import MessageModal from "./MessageModal";

export default function ContactModal({ contact, onClose }) {
  const t = useTranslations("Contacts");
  const commonT = useTranslations("Common");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const info = contact.contactInfo || {};
  const social = contact.socialInfo || {};

  const hasDetails = Object.values(info).some((v) => v !== null);
  const hasSocial = Object.values(social).some((v) => v !== null);

  const detailFields = [
    { label: "Discord", value: info.discordHandle, icon: MessageSquare },
    { label: "Fluxer", value: info.fluxerHandle, icon: MessageSquare },
    {
      label: "Matrix",
      value: info.matrixUser
        ? `@${info.matrixUser}:${info.matrixHomeserver}`
        : null,
      icon: MessageSquare,
    },
    { label: "Signal", value: info.signalNumber, icon: Phone },
    { label: "WhatsApp", value: info.whatsappNumber, icon: Phone },
  ];

  const socialFields = [
    { label: "Unsplash", value: social.unsplashHandle, icon: "Unsplash" },
    { label: "Instagram", value: social.instagramHandle, icon: "Instagram" },
    { label: "Mastodon", value: social.mastodonHandle, icon: "Mastodon" },
    { label: "Pixelfed", value: social.pixelfedHandle, icon: "Pixelfed" },
    { label: "Bluesky", value: social.blueskyHandle, icon: "Bluesky" },
    { label: "YouTube", value: social.youtubeHandle, icon: "Youtube" },
    { label: "Twitch", value: social.twitchHandle, icon: "Twitch" },
  ];

  if (showMessageModal) {
    return (
      <MessageModal
        contact={contact}
        onClose={() => setShowMessageModal(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-sidebar border border-sidebar-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-24 bg-primary/10 flex items-end px-6 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-foreground transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <Avatar
              src={contact.image}
              displayName={contact.displayName}
              size="xl"
              className="rounded-2xl shadow-lg border-4 border-sidebar !w-16 !h-16"
            />
            <div className="mb-1">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {contact.displayName}
                {contact.isCloseFriend && (
                  <Heart size={16} className="fill-primary text-primary" />
                )}
              </h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {t("member")}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-sidebar-border pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("infoTitle")}
              </h3>
              <button
                type="button"
                onClick={() => setShowMessageModal(true)}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
              >
                <Send size={12} />
                {t("sendMessage")}
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">
                    {t("email")}
                  </p>
                  {contact.email ? (
                    <p className="text-foreground">{contact.email}</p>
                  ) : (
                    <p className="text-muted-foreground/60 italic text-xs">
                      {commonT("emailHidden")}
                    </p>
                  )}
                </div>
              </div>

              {detailFields.map(
                ({ label, value, icon: Icon }) =>
                  value && (
                    <div
                      key={label}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">
                          {label}
                        </p>
                        <p className="text-foreground">{value}</p>
                      </div>
                    </div>
                  ),
              )}

              {!hasDetails && !hasSocial && (
                <p className="text-sm text-muted-foreground italic py-2">
                  {t("noInfo")}
                </p>
              )}
            </div>
          </div>

          {hasSocial && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-sidebar-border pb-2">
                {t("socialTitle")}
              </h3>

              <div className="space-y-3">
                {socialFields.map(
                  ({ label, value, icon: iconName }) =>
                    value && (
                      <div
                        key={label}
                        className="flex items-center gap-3 text-sm"
                      >
                        <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground">
                          <BrandIcon name={iconName} size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">
                            {label}
                          </p>
                          <p className="text-foreground">{value}</p>
                        </div>
                      </div>
                    ),
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-sidebar-accent hover:bg-sidebar-accent/80 text-foreground rounded-xl font-medium transition-colors border border-sidebar-border"
          >
            {t("close")}
          </button>
        </div>
      </div>
      {/* Overlay click to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
