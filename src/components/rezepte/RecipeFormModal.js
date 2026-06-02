"use client";

import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Button from "@/components/ui/Button";

const CATEGORIES = [
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

const UNITS = [
  "g",
  "ml",
  "l",
  "tl",
  "el",
  "stk",
  "prise",
  "bund",
  "dose",
  "glas",
  "nach_geschmack",
];

const STEP_CATEGORIES = [
  "vorbereitung",
  "hauptgang",
  "beilage",
  "garnierung",
  "sonstiges",
];

function emptyIngredient() {
  return {
    id: Math.random().toString(36).substr(2, 9),
    amount: "",
    unit: "g",
    name: "",
  };
}

function emptyStep() {
  return {
    id: Math.random().toString(36).substr(2, 9),
    category: "vorbereitung",
    title: "",
    description: "",
  };
}

export default function RecipeFormModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  initialData,
  isEditing = false,
}) {
  const t = useTranslations("Recipes");
  const tc = useTranslations("Common");

  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        ingredients: initialData.ingredients.map((ing) => ({
          ...ing,
          id: ing.id || Math.random().toString(36).substr(2, 9),
        })),
        steps: initialData.steps.map((step) => ({
          ...step,
          id: step.id || Math.random().toString(36).substr(2, 9),
        })),
      };
    }
    return {
      title: "",
      description: "",
      category: "hauptgerichte",
      servings: 4,
      dietaryTags: [],
      image: null,
      ingredients: [emptyIngredient()],
      steps: [emptyStep()],
    };
  });

  const [imagePreview, setImagePreview] = useState(initialData?.image || null);

  if (!isOpen) return null;

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setImagePreview(base64);
      setForm({ ...form, image: base64 });
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImagePreview(null);
    setForm({ ...form, image: null });
  }

  function toggleTag(tag) {
    const current = form.dietaryTags || [];
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    setForm({ ...form, dietaryTags: updated });
  }

  function updateIngredient(idx, field, value) {
    const ingredients = [...form.ingredients];
    ingredients[idx] = { ...ingredients[idx], [field]: value };
    setForm({ ...form, ingredients });
  }

  function addIngredient() {
    setForm({
      ...form,
      ingredients: [...form.ingredients, emptyIngredient()],
    });
  }

  function removeIngredient(idx) {
    const ingredients = form.ingredients.filter((_, i) => i !== idx);
    setForm({ ...form, ingredients });
  }

  function updateStep(idx, field, value) {
    const steps = [...form.steps];
    steps[idx] = { ...steps[idx], [field]: value };
    setForm({ ...form, steps });
  }

  function addStep() {
    setForm({ ...form, steps: [...form.steps, emptyStep()] });
  }

  function removeStep(idx) {
    const steps = form.steps.filter((_, i) => i !== idx);
    setForm({ ...form, steps });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <button
        type="button"
        className="absolute inset-0"
        onClick={() => !loading && onClose()}
        aria-label={tc("close")}
      />
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <h3 className="text-xl font-black">
            {isEditing ? t("editRecipe") : t("createRecipe")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-8"
        >
          {/* Title */}
          <div className="space-y-1.5">
            <label
              htmlFor="recipe-title"
              className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1"
            >
              {tc("title")}
              <span className="text-primary ml-1">*</span>
            </label>
            <input
              id="recipe-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder={t("title")}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="recipe-description"
              className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1"
            >
              {t("stepDescription")}
            </label>
            <textarea
              id="recipe-description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] resize-none"
              placeholder="..."
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label
              htmlFor="recipe-category"
              className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1"
            >
              {t("categoriesLabel")}
            </label>
            <select
              id="recipe-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`category.${cat}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Servings */}
          <div className="space-y-1.5">
            <label
              htmlFor="recipe-servings"
              className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1"
            >
              {t("servings")}
            </label>
            <input
              id="recipe-servings"
              type="number"
              min="1"
              max="99"
              value={form.servings}
              onChange={(e) =>
                setForm({
                  ...form,
                  servings: parseInt(e.target.value, 10) || 4,
                })
              }
              className="w-32 bg-sidebar-accent/50 border border-sidebar-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
            />
          </div>

          {/* Dietary Tags */}
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1">
              {t("tagsLabel")}
            </p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    (form.dietaryTags || []).includes(tag)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {t(`tags.${tag}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="space-y-1.5">
            <label
              htmlFor="recipe-image"
              className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1"
            >
              {t("image")}
            </label>
            {imagePreview ? (
              <div className="relative w-40 h-40 rounded-2xl overflow-hidden bg-sidebar-accent border border-sidebar-border shadow-inner">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label
                htmlFor="recipe-image"
                className="flex items-center gap-3 px-4 py-3 bg-sidebar-accent/50 border border-sidebar-border rounded-2xl cursor-pointer hover:bg-sidebar-accent transition-colors"
              >
                <Upload size={18} className="text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {t("uploadImage")}
                </span>
                <input
                  id="recipe-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>

          {/* Ingredients */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1">
                {t("ingredients")}
              </p>
              <Button
                type="button"
                onClick={addIngredient}
                variant="ghost"
                size="compact"
              >
                <Plus size={14} />
                {t("addIngredient")}
              </Button>
            </div>
            <div className="space-y-2">
              {form.ingredients.map((ing, idx) => (
                <div key={ing.id} className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={ing.amount}
                    onChange={(e) =>
                      updateIngredient(idx, "amount", e.target.value)
                    }
                    className="w-20 bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-center"
                    placeholder="0"
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) =>
                      updateIngredient(idx, "unit", e.target.value)
                    }
                    className="w-24 bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {t(`units.${u}`)}
                      </option>
                    ))}
                  </select>
                  <input
                    value={ing.name}
                    onChange={(e) =>
                      updateIngredient(idx, "name", e.target.value)
                    }
                    className="flex-1 bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder={t("ingredient")}
                  />
                  {form.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(idx)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1">
                {t("steps")}
              </p>
              <Button
                type="button"
                onClick={addStep}
                variant="ghost"
                size="compact"
              >
                <Plus size={14} />
                {t("addStep")}
              </Button>
            </div>
            <div className="space-y-4">
              {form.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="p-5 bg-sidebar-accent/20 border border-sidebar-border rounded-2xl space-y-3 shadow-inner"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t("step")} {idx + 1}
                    </span>
                    {form.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <select
                        value={step.category}
                        onChange={(e) =>
                          updateStep(idx, "category", e.target.value)
                        }
                        className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                      >
                        {STEP_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {t(`stepCategories.${cat}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        value={step.title}
                        onChange={(e) =>
                          updateStep(idx, "title", e.target.value)
                        }
                        className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder={t("stepTitle")}
                      />
                    </div>
                  </div>
                  <textarea
                    value={step.description}
                    onChange={(e) =>
                      updateStep(idx, "description", e.target.value)
                    }
                    className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px] resize-none"
                    placeholder={t("stepDescription")}
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {tc("cancel")}
          </button>
          <Button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {isEditing ? tc("save") : t("createRecipe")}
          </Button>
        </div>
      </div>
    </div>
  );
}
