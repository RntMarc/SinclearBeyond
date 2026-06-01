"use client";

import { Star, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const CATEGORY_COLORS = {
  vorspeisen: "bg-orange-500/10 text-orange-500",
  hauptgerichte: "bg-red-500/10 text-red-500",
  desserts: "bg-pink-500/10 text-pink-500",
  salate: "bg-green-500/10 text-green-500",
  suppen: "bg-amber-500/10 text-amber-500",
  backen: "bg-yellow-500/10 text-yellow-500",
  fruehstueck: "bg-sky-500/10 text-sky-500",
  getraenke: "bg-blue-500/10 text-blue-500",
  sonstiges: "bg-gray-500/10 text-gray-500",
};

export default function RecipeCard({ recipe }) {
  const t = useTranslations("Recipes");

  const tags = recipe.dietaryTags ? recipe.dietaryTags.split(",") : [];

  return (
    <Link
      href={`/rezepte/${recipe.id}`}
      className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all shadow-sm flex flex-col"
    >
      {recipe.image ? (
        <div className="aspect-[4/3] w-full overflow-hidden relative bg-muted">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <span
              className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${
                CATEGORY_COLORS[recipe.category] ||
                "bg-gray-500/10 text-gray-500"
              }`}
            >
              {t(`category.${recipe.category}`)}
            </span>
          </div>
        </div>
      ) : (
        <div className="aspect-[4/3] w-full bg-muted flex items-center justify-center relative">
          <UtensilsCrossed
            className="text-muted-foreground/20"
            size={48}
          />
          <div className="absolute bottom-3 left-3">
            <span
              className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                CATEGORY_COLORS[recipe.category] ||
                "bg-gray-500/10 text-gray-500"
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

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Star
              size={14}
              fill={recipe.avgRating ? "currentColor" : "none"}
            />
            <span className="text-xs font-bold text-orange-500">
              {recipe.avgRating
                ? Number(recipe.avgRating).toFixed(1)
                : "-"}
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
