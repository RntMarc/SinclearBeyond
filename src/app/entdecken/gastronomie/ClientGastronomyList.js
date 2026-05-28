"use client";

import { Map as MapIcon, Plus, Search, Star, Utensils } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import AddPlaceModal from "@/components/discover/AddPlaceModal";
import DiscoverSearchModal from "@/components/discover/DiscoverSearchModal";
import OpeningStatusBadge from "@/components/discover/OpeningStatusBadge";
import SubPageHeader from "@/components/layout/SubPageHeader";
import Button from "@/components/ui/Button";
import { useIsMobile } from "@/hooks/useIsMobile";

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
  const isMobile = useIsMobile();
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
        {!isMobile && (
          <Button type="button" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            {t("addPlace")}
          </Button>
        )}
      </SubPageHeader>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div className="max-w-5xl mx-auto space-y-8">
          {showMap && initialPlaces.length > 0 && (
            <div className="h-[300px] w-full rounded-[2rem] overflow-hidden border border-border shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
              <ResultsMap places={initialPlaces} showNumbers={true} />
            </div>
          )}

          {initialPlaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {initialPlaces.map((place, index) => (
                <Link
                  key={place.id}
                  href={`/entdecken/orte/${place.id}`}
                  className="group bg-card border border-border rounded-[2rem] overflow-hidden hover:border-primary/50 transition-all shadow-sm flex flex-col relative"
                >
                  {showMap && (
                    <div className="absolute top-4 right-4 w-7 h-7 rounded-[2rem] bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-sm z-10">
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
          ) : (
            <div className="p-20 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center text-center">
              <Utensils size={48} className="text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground mb-6">{t("noGastronomy")}</p>
              <Button type="button" onClick={() => setShowAddModal(true)}>
                {t("addFirst")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {isMobile && (
        <Button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 right-6 w-14 h-14 z-50 shadow-lg"
          size="icon"
          aria-label={t("addPlace")}
        >
          <Plus size={24} />
        </Button>
      )}

      {showAddModal && <AddPlaceModal onClose={() => setShowAddModal(false)} />}

      {showSearchModal && (
        <DiscoverSearchModal onClose={() => setShowSearchModal(false)} />
      )}
    </div>
  );
}
