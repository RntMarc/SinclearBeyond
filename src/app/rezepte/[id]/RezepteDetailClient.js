"use client";

import {
  Bookmark,
  Calendar,
  Edit3,
  Minus,
  Plus,
  Share2,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import RecipeFormModal from "@/components/rezepte/RecipeFormModal";
import RecipeReviewSection from "@/components/rezepte/RecipeReviewSection";
import SubPageHeader from "@/components/layout/SubPageHeader";

const CATEGORY_COLORS = {
  vorspeisen: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  hauptgerichte: "bg-red-500/10 text-red-500 border-red-500/20",
  desserts: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  salate: "bg-green-500/10 text-green-500 border-green-500/20",
  suppen: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  backen: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  fruehstueck: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  getraenke: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  sonstiges: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default function RezepteDetailClient({
  recipe: initialRecipe,
  reviews: initialReviews,
  userId,
}) {
  const t = useTranslations("Recipes");

  const [recipe, setRecipe] = useState(initialRecipe);
  const [reviews, setReviews] = useState(initialReviews);
  const [servingFactor, setServingFactor] = useState(
    recipe.servings ? recipe.servings : 1,
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const baseServings = recipe.servings || 4;
  const tags = recipe.dietaryTags ? recipe.dietaryTags.split(",") : [];

  function adjustServings(newServings) {
    if (newServings < 1) return;
    if (newServings > 99) return;
    setServingFactor(newServings);
  }

  const groupedSteps = recipe.steps.reduce((acc, step) => {
    if (!acc[step.category]) acc[step.category] = [];
    acc[step.category].push(step);
    return acc;
  }, {});

  async function toggleBookmark() {
    try {
      const res = await fetch("/api/rezepte/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecipe({ ...recipe, isBookmarked: data.bookmarked ? 1 : 0 });
      }
    } catch (err) {
      console.error("Failed to toggle bookmark", err);
    }
  }

  function handleReviewsChange(newReviews) {
    setReviews(newReviews);
  }

  async function handleEditRecipe(formData) {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/rezepte/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Failed to update recipe", err);
        return;
      }

      setShowEditModal(false);

      const recipeRes = await fetch(`/api/rezepte/${recipe.id}`);
      const updatedRecipe = await recipeRes.json();
      setRecipe(updatedRecipe);
      setServingFactor(updatedRecipe.servings || 4);
    } catch (err) {
      console.error("Failed to update recipe", err);
    } finally {
      setEditLoading(false);
    }
  }

  const share = () => {
    const text = t("shareText", { title: recipe.title });
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(t("linkCopied"));
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <SubPageHeader
        title={recipe.title}
        subtitle={t("title")}
        backHref="/rezepte"
      >
        <button
          type="button"
          onClick={share}
          className="p-2 hover:bg-muted rounded-full transition-colors"
          aria-label="Share"
        >
          <Share2 size={20} />
        </button>
      </SubPageHeader>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-12">
          {/* Hero Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="aspect-square rounded-3xl overflow-hidden bg-muted shadow-xl border border-border">
                {recipe.image ? (
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UtensilsCrossed
                      className="text-muted-foreground/20"
                      size={64}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col justify-center space-y-6">
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                  {recipe.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      CATEGORY_COLORS[recipe.category] ||
                      "bg-gray-500/10 text-gray-500 border-gray-500/20"
                    }`}
                  >
                    {t(`category.${recipe.category}`)}
                  </span>

                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider"
                    >
                      {t(`tags.${tag}`)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-orange-500">
                      <Star size={32} fill="currentColor" />
                      <span className="text-3xl font-black">
                        {recipe.avgRating
                          ? Number(recipe.avgRating).toFixed(1)
                          : "-"}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">
                      {recipe.reviewCount}{" "}
                      {recipe.reviewCount === 1 ? t("rating") : t("rating")}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleBookmark}
                  className={`p-3 rounded-2xl transition-all ${
                    recipe.isBookmarked
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                  }`}
                  aria-label={
                    recipe.isBookmarked ? t("bookmarked") : t("bookmark")
                  }
                >
                  <Bookmark
                    size={20}
                    fill={recipe.isBookmarked ? "currentColor" : "none"}
                  />
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                <span>
                  {t("by")} {recipe.creatorName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(recipe.createdAt).toLocaleDateString()}
                </span>
              </div>

              {recipe.description && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {recipe.description}
                </p>
              )}
            </div>
          </section>

          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black">{t("ingredients")}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t("servings")}
                  </span>
                  <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => adjustServings(servingFactor - 1)}
                      className="p-1.5 rounded-lg hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">
                      {servingFactor}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustServings(servingFactor + 1)}
                      className="p-1.5 rounded-lg hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {userId === recipe.creatorId && (
                    <button
                      type="button"
                      onClick={() => setShowEditModal(true)}
                      className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-primary ml-2"
                      aria-label={t("editRecipe")}
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-muted/30 rounded-3xl overflow-hidden border border-border divide-y divide-border">
                {recipe.ingredients.map((ing) => {
                  const scaledAmount =
                    baseServings !== servingFactor
                      ? ((parseFloat(ing.amount) / baseServings) * servingFactor).toFixed(1)
                      : ing.amount;
                  return (
                    <div
                      key={ing.id}
                      className="px-6 py-3 flex items-center gap-4 text-sm"
                    >
                      <span className="font-bold text-primary min-w-[60px]">
                        {scaledAmount} {t(`units.${ing.unit}`)}
                      </span>
                      <span className="font-medium">{ing.name}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Steps grouped by category */}
          {Object.keys(groupedSteps).length > 0 && (
            <section className="space-y-8">
              <h2 className="text-2xl font-black">{t("steps")}</h2>
              {Object.entries(groupedSteps).map(([category, steps]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
                    {t(`stepCategories.${category}`)}
                  </h3>
                  <div className="space-y-4">
                    {steps.map((step, idx) => (
                      <div
                        key={step.id}
                        className="p-5 bg-card border border-border rounded-2xl space-y-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                            {idx + 1}
                          </span>
                          {step.title && (
                            <h4 className="font-bold">{step.title}</h4>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed ml-10">
                          {step.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Reviews */}
          <section className="space-y-6">
            <RecipeReviewSection
              recipeId={recipe.id}
              reviews={reviews}
              currentUserId={userId}
              onReviewsChange={handleReviewsChange}
            />
          </section>
        </div>
      </div>

      <RecipeFormModal
        isOpen={showEditModal}
        isEditing
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditRecipe}
        loading={editLoading}
        initialData={{
          title: recipe.title,
          description: recipe.description || "",
          category: recipe.category,
          servings: recipe.servings || 4,
          dietaryTags: tags,
          image: recipe.image,
          ingredients: recipe.ingredients.map((ing) => ({
            amount: ing.amount,
            unit: ing.unit,
            name: ing.name,
          })),
          steps: recipe.steps.map((step) => ({
            category: step.category,
            title: step.title || "",
            description: step.description,
          })),
        }}
      />
    </div>
  );
}
