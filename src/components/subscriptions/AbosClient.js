"use client";

import { Banknote, Calendar, CheckCircle2, Circle, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AbosClient({ initialSubscriptions }) {
  const t = useTranslations("Subscriptions");

  if (!initialSubscriptions || initialSubscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-border rounded-2xl">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
          <Banknote size={32} />
        </div>
        <p className="text-muted-foreground">{t("noSubscriptions")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {initialSubscriptions.map((sub) => {
        const perHeadPrice = (sub.basePrice / sub.members.length).toFixed(2);

        return (
          <div
            key={sub.id}
            className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">{sub.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar size={14} className="text-primary" />
                  <span>
                    {new Date(sub.billingPeriodStart).toLocaleDateString(
                      "de-DE",
                    )}{" "}
                    –{" "}
                    {new Date(sub.billingPeriodEnd).toLocaleDateString("de-DE")}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-primary">
                  {sub.basePrice.toFixed(2)}€
                </p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  {t("basePrice")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("pricePerHead")}
                </p>
                <p className="text-lg font-bold">{perHeadPrice}€</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("members")}
                </p>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  <p className="text-lg font-bold">{sub.members.length}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Users size={16} className="text-primary" />
                {t("members")}
              </h4>
              <div className="space-y-2">
                {sub.members.map((member, idx) => (
                  <div
                    key={member.id || idx}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-xl text-sm"
                  >
                    <span className="font-medium">
                      {member.userName || "Unbekannt"}
                    </span>
                    <div className="flex items-center gap-2">
                      {member.hasPaid
                        ? <>
                            <span className="text-[10px] font-bold uppercase text-green-500">
                              {t("paid")}
                            </span>
                            <CheckCircle2
                              size={16}
                              className="text-green-500"
                            />
                          </>
                        : <>
                            <span className="text-[10px] font-bold uppercase text-amber-500">
                              {t("pending")}
                            </span>
                            <Circle size={16} className="text-amber-500" />
                          </>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
