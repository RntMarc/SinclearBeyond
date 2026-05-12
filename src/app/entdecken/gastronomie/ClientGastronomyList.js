"use client";

import {
  ArrowLeft,
  Plus,
  Star,
  Utensils,
  Search,
  Map as MapIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import AddPlaceModal from "@/components/discover/AddPlaceModal";
import SubPageHeader from "@/components/layout/SubPageHeader";
import DiscoverSearchModal from "@/components/discover/DiscoverSearchModal";
import OpeningStatusBadge from "@/components/discover/OpeningStatusBadge";
import dynamic from "next/dynamic";

const ResultsMap = dynamic(() => import("../ResultsMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Karte wird geladen...</p>
    </div>
  ),
});

export default function ClientGastronomyList({ initialPlaces }) {
  const t = useTranslations("Discover");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background">
      <SubPageHeader
        backHref="/entdecken"
        subtitle={t("subtitle")}
        title={t("categories.gastronomy")}
        icon={Utensils}
      >
        <button
          type="button"
          onClick={() => setShowSearchModal(true)}
          className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
        >
          <Search size={20} />
        </button>
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className={`p-2 rounded-full transition-colors ${showMap ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}
        >
          <MapIcon size={20} />
        </button>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          <Plus size={16} />
          {t("addPlace")}
        </button>
      </SubPageHeader>

      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          {showMap && initialPlaces.length > 0 && (
            <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-border shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
              <ResultsMap places={initialPlaces} showNumbers={true} />
            </div>
          )}

          {initialPlaces.length > 0
            ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialPlaces.map((place, index) => (
                  <Link
                    key={place.id}
                    href={`/entdecken/orte/${place.id}`}
                    className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all shadow-sm flex flex-col relative"
                  >
                    {showMap && (
                      <div className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-sm z-10">
                        {index + 1}
                      </div>
                    )}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors pr-8">
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

                      <OpeningStatusBadge status={place.openingStatus} />
                    </div>
                  </Link>
                ))}
              </div>
            : <div className="p-20 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center">
                <Utensils size={48} className="text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground mb-6">
                  {t("noGastronomy")}
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold"
                >
                  {t("addFirst")}
                </button>
              </div>}
        </div>
      </div>

      {showAddModal && <AddPlaceModal onClose={() => setShowAddModal(false)} />}

      {showSearchModal && (
        <DiscoverSearchModal onClose={() => setShowSearchModal(false)} />
      )}
    </div>
  );
}
