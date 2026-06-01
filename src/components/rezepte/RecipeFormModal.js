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
  return { amount: "", unit: "g", name: "" };
}

function emptyStep() {
  return { category: "vorbereitung", title: "", description: "" };
}

export default function RecipeFormModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  initialData,
}) {
  const t = useTranslations("Recipes");
  const tc = useTranslations("Common");

  const [form, setForm] = useState(
    initialData || {
      title: "",
      description: "",
      category: "hauptgerichte",
      dietaryTags: [],
      image: null,
      ingredients: [emptyIngredient()],
      steps: [emptyStep()],
    },
  );

  const [imagePreview, setImagePreview] = useState(
    initialData?.image || null,
  );

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <button
        type="button"
        className="absolute inset-0"
        onClick={() => !loading && onClose()}
        aria-label={tc("close")}
      />
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="text-xl font-black">{t("createRecipe")}</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              {tc("title")}
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
              placeholder={t("title")}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              {t("title")}
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full p-4 bg-muted border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px] text-sm resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              {t("categoriesLabel")}
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              className="w-full p-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`category.${cat}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Dietary Tags */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              {t("tagsLabel")}
            </label>
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
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              {t("image")}
            </label>
            {imagePreview ? (
              <div className="relative w-40 h-40 rounded-2xl overflow-hidden bg-muted border border-border">
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
              <label className="flex items-center gap-3 px-4 py-3 bg-muted border border-border rounded-xl cursor-pointer hover:bg-muted/80 transition-colors">
                <Upload size={18} className="text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {t("uploadImage")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {t("ingredients")}
              </label>
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
                <div
                  key={idx}
                  className="flex items-center gap-2"
                >
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={ing.amount}
                    onChange={(e) =>
                      updateIngredient(idx, "amount", e.target.value)
                    }
                    className="w-20 p-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-center"
                    placeholder="0"
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) =>
                      updateIngredient(idx, "unit", e.target.value)
                    }
                    className="w-24 p-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
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
                    className="flex-1 p-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {t("steps")}
              </label>
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
                  key={idx}
                  className="p-4 bg-muted/30 border border-border rounded-2xl space-y-3"
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
                        className="w-full p-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
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
                        className="w-full p-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        placeholder={t("stepTitle")}
                      />
                    </div>
                  </div>
                  <textarea
                    value={step.description}
                    onChange={(e) =>
                      updateStep(idx, "description", e.target.value)
                    }
                    className="w-full p-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm min-h-[60px] resize-none"
                    placeholder={t("stepDescription")}
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              disabled={loading}
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {t("saveRecipe")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
