"use client";

import { Bookmark, Plus, Search, UtensilsCrossed, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import RecipeCard from "@/components/rezepte/RecipeCard";
import RecipeFormModal from "@/components/rezepte/RecipeFormModal";
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

export default function RezepteClient({ initialRecipes }) {
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

      if (activeCategory !== "all" && r.category !== activeCategory)
        return false;

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

      await res.json();
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
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={UtensilsCrossed}
      >
        <div className="hidden md:block">
          <Button
            type="button"
            onClick={() => setShowForm(true)}
            size="compact"
          >
            <Plus size={16} />
            {t("newRecipe")}
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-12">
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
              className="w-full pl-11 pr-4 py-4 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-sm font-medium"
            />
          </div>

          {/* Filters Container */}
          <div className="space-y-4">
            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-sidebar-accent/50 p-1 rounded-xl border border-sidebar-border max-w-full overflow-x-auto no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat === "all" ? t("allCategories") : t(`category.${cat}`)}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Bookmark Filter */}
              <button
                type="button"
                onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium ${
                  showBookmarkedOnly
                    ? "bg-primary/10 border-primary/50 text-primary"
                    : "bg-sidebar-accent/50 border-sidebar-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Bookmark
                  size={16}
                  fill={showBookmarkedOnly ? "currentColor" : "none"}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {t("bookmark")}
                </span>
                {bookmarkedCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      showBookmarkedOnly
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {bookmarkedCount}
                  </span>
                )}
              </button>

              {/* Tag Filter */}
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      activeTags.includes(tag)
                        ? "bg-primary/5 border-primary/30 text-primary"
                        : "bg-sidebar-accent/30 border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t(`tags.${tag}`)}
                  </button>
                ))}
                {activeTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTags([])}
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                  >
                    <X size={12} />
                    Clear
                  </button>
                )}
              </div>
            </div>
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
                  {recipes.length === 0 ? t("noRecipes") : t("emptyFilter")}
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

      {/* FAB for Mobile */}
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-40"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
