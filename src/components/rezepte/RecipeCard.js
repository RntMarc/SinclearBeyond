"use client";

import { Star, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const CATEGORY_COLORS = {
  vorspeisen: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  hauptgerichte: "bg-red-500/20 text-red-400 border-red-500/30",
  desserts: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  salate: "bg-green-500/20 text-green-400 border-green-500/30",
  suppen: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  backen: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  fruehstueck: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  getraenke: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  sonstiges: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function RecipeCard({ recipe }) {
  const t = useTranslations("Recipes");

  const tags = recipe.dietaryTags ? recipe.dietaryTags.split(",") : [];

  return (
    <Link
      href={`/rezepte/${recipe.id}`}
      className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col"
    >
      {recipe.image ? (
        <div className="aspect-[16/10] w-full overflow-hidden relative bg-muted">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-3 left-3">
            <span
              className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                CATEGORY_COLORS[recipe.category] ||
                "bg-gray-500/20 text-gray-400 border-gray-500/30"
              }`}
            >
              {t(`category.${recipe.category}`)}
            </span>
          </div>
        </div>
      ) : (
        <div className="aspect-[16/10] w-full bg-muted flex items-center justify-center relative overflow-hidden">
          <UtensilsCrossed
            className="text-muted-foreground/10 absolute -right-4 -bottom-4 rotate-12"
            size={120}
          />
          <UtensilsCrossed
            className="text-muted-foreground/20 relative z-10"
            size={48}
          />
          <div className="absolute top-3 left-3">
            <span
              className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                CATEGORY_COLORS[recipe.category] ||
                "bg-gray-500/20 text-gray-400 border-gray-500/30"
              }`}
            >
              {t(`category.${recipe.category}`)}
            </span>
          </div>
        </div>
      )}

      <div className="p-5 space-y-3 flex-1 flex flex-col">
        <div className="space-y-2 flex-1">
          <h3 className="font-bold text-base group-hover:text-primary transition-colors line-clamp-1">
            {recipe.title}
          </h3>

          {recipe.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {recipe.description}
            </p>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[10px] font-medium uppercase tracking-wider"
              >
                {t(`tags.${tag}` || tag)}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
          <div className="flex items-center gap-1.5">
            <Star
              size={14}
              className={
                recipe.avgRating
                  ? "text-orange-500"
                  : "text-muted-foreground/40"
              }
              fill={recipe.avgRating ? "currentColor" : "none"}
            />
            <span className="text-sm font-black">
              {recipe.avgRating ? Number(recipe.avgRating).toFixed(1) : "-"}
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              ({recipe.reviewCount})
            </span>
          </div>

          {recipe.isBookmarked ? (
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
              ★
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
