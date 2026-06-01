"use client";

import { Bookmark, Plus, Search, UtensilsCrossed, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import RecipeCard from "@/components/rezepte/RecipeCard";
import RecipeFormModal from "@/components/rezepte/RecipeFormModal";
import SubPageHeader from "@/components/layout/SubPageHeader";
import Button from "@/components/ui/Button";

const CATEGORIES = [
  "all",
  "vorspeisen",
  "hauptgerichte",
  "desserts",
  "salate",
  "suppen",
  "backen",
  "fruehstueck",
  "getraenke",
  "sonstiges",
];

const TAGS = [
  "vegetarisch",
  "vegan",
  "glutenfrei",
  "laktosefrei",
  "low_carb",
  "high_protein",
  "zuckerfrei",
];

export default function RezepteClient({ initialRecipes, userId }) {
  const t = useTranslations("Recipes");

  const [recipes, setRecipes] = useState(initialRecipes);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTags, setActiveTags] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      if (showBookmarkedOnly && !r.isBookmarked) return false;

      if (activeCategory !== "all" && r.category !== activeCategory) return false;

      if (activeTags.length > 0) {
        const recipeTags = r.dietaryTags ? r.dietaryTags.split(",") : [];
        const hasAll = activeTags.every((tag) => recipeTags.includes(tag));
        if (!hasAll) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesDesc = r.description
          ? r.description.toLowerCase().includes(q)
          : false;
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [recipes, activeCategory, activeTags, search, showBookmarkedOnly]);

  const bookmarkedCount = recipes.filter((r) => r.isBookmarked).length;

  function toggleTag(tag) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleCreateRecipe(formData) {
    setFormLoading(true);
    try {
      const res = await fetch("/api/rezepte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Failed to create recipe", err);
        return;
      }

      const result = await res.json();
      setShowForm(false);

      const recipesRes = await fetch("/api/rezepte");
      setRecipes(await recipesRes.json());
    } catch (err) {
      console.error("Failed to create recipe", err);
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <SubPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        backHref="/home"
      >
        <Button
          type="button"
          onClick={() => setShowForm(true)}
          size="compact"
        >
          <Plus size={16} />
          {t("newRecipe")}
        </Button>
      </SubPageHeader>

      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search")}
              className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat === "all" ? t("allCategories") : t(`category.${cat}`)}
              </button>
            ))}
          </div>

          {/* Bookmark Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                showBookmarkedOnly
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Bookmark size={14} fill={showBookmarkedOnly ? "currentColor" : "none"} />
              {t("bookmark")}
              {bookmarkedCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  showBookmarkedOnly
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary/10 text-primary"
                }`}>
                  {bookmarkedCount}
                </span>
              )}
            </button>
          </div>

          {/* Tag Filter */}
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  activeTags.includes(tag)
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent"
                }`}
              >
                {t(`tags.${tag}`)}
              </button>
            ))}
            {activeTags.length > 0 && (
              <button
                onClick={() => setActiveTags([])}
                className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </div>

          {/* Recipe Grid */}
          <section>
            {filteredRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            ) : (
              <div className="col-span-full p-20 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <UtensilsCrossed
                    className="text-muted-foreground/30"
                    size={32}
                  />
                </div>
                <p className="text-muted-foreground">
                  {recipes.length === 0
                    ? t("noRecipes")
                    : t("emptyFilter")}
                </p>
                {recipes.length === 0 && (
                  <Button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="mt-4"
                  >
                    <Plus size={16} />
                    {t("createFirst")}
                  </Button>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <RecipeFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateRecipe}
        loading={formLoading}
      />
    </div>
  );
}
