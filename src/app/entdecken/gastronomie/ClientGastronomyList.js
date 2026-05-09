"use client";

import { ArrowLeft, Plus, Star, Utensils } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import AddPlaceModal from "@/components/discover/AddPlaceModal";

export default function ClientGastronomyList({ initialPlaces }) {
  const t = useTranslations("Discover");
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-6 py-6 border-b border-border bg-card shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/entdecken"
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-primary">
                <Utensils size={10} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {t("subtitle")}
                </span>
              </div>
              <h1 className="text-xl font-black">
                {t("categories.gastronomy")}
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            <Plus size={16} />
            {t("addPlace")}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          {initialPlaces.length > 0
            ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialPlaces.map((place) => (
                  <Link
                    key={place.id}
                    href={`/entdecken/orte/${place.id}`}
                    className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all shadow-sm flex flex-col"
                  >
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                          {place.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {place.address}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-orange-500">
                          <Star
                            size={16}
                            fill={place.avgRating ? "currentColor" : "none"}
                          />
                          <span className="text-sm font-bold">
                            {place.avgRating
                              ? Number(place.avgRating).toFixed(1)
                              : "-"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({place.reviewCount} {t("reviews")})
                        </span>
                      </div>

                      {place.openingHours && (
                        <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-md inline-block max-w-full truncate">
                          {place.openingHours}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            : <div className="p-20 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center">
                <Utensils size={48} className="text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground mb-6">
                  Noch keine Restaurants oder Cafés eingetragen.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold"
                >
                  Den ersten Ort hinzufügen
                </button>
              </div>}
        </div>
      </div>

      {showAddModal && (
        <AddPlaceModal
          initialCategory="gastronomy"
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
