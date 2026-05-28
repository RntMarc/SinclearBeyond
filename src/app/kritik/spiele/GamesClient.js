"use client";

import { Gamepad2, Star } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import SubPageHeader from "@/components/layout/SubPageHeader";
import ReviewSearch from "@/components/reviews/ReviewSearch";

export default function GamesClient({ initialGames }) {
  const t = useTranslations("Reviews");
  const ts = useTranslations("Reviews.search");

  const [games, _setGames] = useState(initialGames);

  return (
    <div className="flex flex-col h-full bg-background">
      <SubPageHeader
        title={t("games")}
        subtitle={t("subtitle")}
        backHref="/kritik"
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Search Bar */}
          <section className="pt-2">
            <ReviewSearch />
          </section>

          {/* Games List */}
          <section>
            <h2 className="text-lg font-bold mb-6">{t("latestReviews")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <GameCard key={game.id} game={game} t={t} />
              ))}

              {games.length === 0 && (
                <div className="col-span-full p-20 border-2 border-dashed border-border rounded-[2rem] text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gamepad2 className="text-muted-foreground/30" size={32} />
                  </div>
                  <p className="text-muted-foreground">{ts("noResults")}</p>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    {ts("gameEmptyHint")}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function GameCard({ game, t }) {
  return (
    <Link
      href={`/kritik/spiele/${game.id}`}
      className="group bg-card border border-border rounded-[2rem] overflow-hidden hover:border-primary/50 transition-all shadow-sm flex flex-col"
    >
      {game.image && (
        <div className="aspect-video w-full overflow-hidden relative bg-muted">
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors line-clamp-1">
              {game.title}
            </h3>
          </div>
        </div>
      )}
      <div className="p-6 space-y-4">
        {!game.image && (
          <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
            {game.title}
          </h3>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-orange-500">
              <Star size={16} fill={game.avgRating ? "currentColor" : "none"} />
              <span className="text-sm font-bold">
                {game.avgRating ? Number(game.avgRating).toFixed(1) : "-"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({game.reviewCount} {t("reviews")})
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 italic">
          {game.description}
        </p>
      </div>
    </Link>
  );
}
