"use client";

import {
  Bookmark,
  Check,
  Clock,
  Globe,
  Info,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Share2,
  Star,
  Trash2,
  TreePine,
  User as UserIcon,
  Utensils,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import DiscoverSearchModal from "@/components/discover/DiscoverSearchModal";
import OpeningStatusBadge from "@/components/discover/OpeningStatusBadge";
import ReviewModal from "@/components/discover/ReviewModal";
import SimpleOSM from "@/components/discover/SimpleOSM";
import SubPageHeader from "@/components/layout/SubPageHeader";
import Button from "@/components/ui/Button";
import SubmitButton from "@/components/ui/SubmitButton";
import { fetchAction } from "@/lib/asyncAction";

const CATEGORY_SLUGS = {
  gastronomy: "gastronomie",
  leisure: "freizeit",
};

export default function PlaceDetailPage({ id, userId, isAdmin }) {
  const t = useTranslations("Discover");
  const tc = useTranslations("Common");
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showOSMInfo, setShowOSMInfo] = useState(false);
  const router = useRouter();

  const loadPlace = useCallback(async () => {
    try {
      const res = await fetch(`/api/discover/places/${id}`);
      if (!res.ok) throw new Error(t("errorUpdate"));
      const data = await res.json();
      setPlace(data);

      // Check if bookmarked
      const bmRes = await fetch("/api/discover/bookmarks");
      if (bmRes.ok) {
        const bookmarks = await bmRes.json();
        setBookmarked(bookmarks.some((b) => b.id === id));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadPlace();
  }, [loadPlace]);

  async function toggleBookmark() {
    setBookmarkLoading(true);
    try {
      const result = await fetchAction(
        "/api/discover/bookmarks",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ placeId: id }),
        },
        { fallbackError: t("errorUpdate") },
      );
      if (result.ok) {
        setBookmarked(result.data?.bookmarked);
      }
    } finally {
      setBookmarkLoading(false);
    }
  }

  async function sharePlace() {
    const shareData = {
      title: place.name,
      text: `Schau dir ${place.name} an!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (_err) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function deletePlace() {
    if (!confirm(t("deleteConfirm")))
      return { ok: false, error: "Abgebrochen" };
    const result = await fetchAction(
      `/api/discover/places/${id}`,
      { method: "DELETE" },
      { fallbackError: t("errorUpdate") },
    );
    if (result.ok) {
      router.push(`/entdecken/${place.category}`);
      return { ok: true };
    }
    alert(result.error);
    return { ok: false, error: result.error };
  }

  function handleEditReview(review) {
    setEditingReview(review);
    setShowReviewModal(true);
  }

  async function deleteReview(reviewId) {
    if (!confirm(t("deleteReviewConfirm")))
      return { ok: false, error: "Abgebrochen" };
    const result = await fetchAction(
      `/api/discover/reviews/${reviewId}`,
      { method: "DELETE" },
      { fallbackError: t("errorUpdate") },
    );
    if (result.ok) {
      loadPlace();
      return { ok: true };
    }
    alert(result.error);
    return { ok: false, error: result.error };
  }

  async function refreshFromOSM() {
    if (!place.osmId) return;
    setUpdating(true);
    try {
      // 1. Get current details from OSM
      const type = place.osmType || "N";
      const res = await fetch(
        `/api/discover/osm/details/${place.osmId}?type=${type}`,
      );
      if (!res.ok) throw new Error(t("errorUpdate"));
      const osmData = await res.json();

      // 2. Update our DB
      const updateRes = await fetch(`/api/discover/places/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: osmData.address,
          phone: osmData.phone,
          website: osmData.website,
          email: osmData.email,
          openingHours: osmData.openingHours,
          latitude: parseFloat(osmData.latitude),
          longitude: parseFloat(osmData.longitude),
        }),
      });

      if (updateRes.ok) {
        loadPlace();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading)
    return (
      <div className="p-10 text-center animate-pulse">{t("details")}...</div>
    );
  if (error)
    return <div className="p-10 text-center text-destructive">{error}</div>;

  const avgRating =
    place.reviews.length > 0
      ? place.reviews.reduce((acc, r) => acc + r.rating, 0) /
        place.reviews.length
      : 0;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <SubPageHeader
        backHref={`/entdecken/${CATEGORY_SLUGS[place.category] || place.category}`}
        subtitle={t(`categories.${place.category}`)}
        title={place.name}
        icon={place.category === "gastronomy" ? Utensils : TreePine}
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
          onClick={sharePlace}
          className="p-2 hover:bg-muted rounded-full transition-colors relative"
          title={t("share")}
        >
          {copied ? (
            <Check size={20} className="text-green-500" />
          ) : (
            <Share2 size={20} />
          )}
          {copied && (
            <span className="absolute -bottom-8 right-0 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-lg border border-border whitespace-nowrap animate-in fade-in zoom-in duration-200">
              {t("linkCopied")}
            </span>
          )}
        </button>
        <SubmitButton
          type="button"
          size="icon"
          variant="ghost"
          onClick={toggleBookmark}
          loading={bookmarkLoading}
          icon={
            <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
          }
          showInlineError={false}
          successDuration={0}
          title={t("bookmarks")}
          className={`p-2 hover:bg-muted rounded-full ${bookmarked ? "text-primary" : ""}`}
        />
        {(place.creatorId === userId || isAdmin) && (
          <SubmitButton
            type="button"
            size="icon"
            variant="ghost"
            onClick={deletePlace}
            icon={<Trash2 size={20} />}
            showInlineError={false}
            successDuration={0}
            title="Löschen"
            className="p-2 hover:bg-muted rounded-full text-destructive"
          />
        )}
      </SubPageHeader>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column: Map & Primary Info (Mobile First) */}
            <div className="space-y-8">
              <div className="aspect-video lg:aspect-square w-full">
                <SimpleOSM
                  lat={place.latitude}
                  lon={place.longitude}
                  name={place.name}
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-orange-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={20}
                        fill={avgRating >= s ? "currentColor" : "none"}
                        className={
                          avgRating >= s ? "" : "text-muted-foreground/20"
                        }
                      />
                    ))}
                  </div>
                  <span className="font-bold text-lg">
                    {avgRating > 0 ? avgRating.toFixed(1) : "-"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({place.reviews.length} {t("reviews")})
                  </span>
                </div>

                {place.description && (
                  <p className="text-muted-foreground leading-relaxed">
                    {place.description}
                  </p>
                )}

                {place.needsUpdate && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold">Veraltete Daten?</p>
                      <p className="text-xs text-muted-foreground">
                        Diese Informationen sind älter als 30 Tage.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={refreshFromOSM}
                      disabled={updating}
                      size="icon"
                      className="rounded-lg"
                    >
                      <RefreshCcw
                        size={16}
                        className={updating ? "animate-spin" : ""}
                      />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Tabs (Desktop side-by-side effectively) */}
            <div className="space-y-8">
              {/* Tabs Switcher for Mobile */}
              <div className="flex lg:hidden border-b border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("info")}
                  className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "info" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                >
                  {t("information")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("reviews")}
                  className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "reviews" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                >
                  {t("reviews")}
                </button>
              </div>

              {/* Info Section */}
              <div
                className={`${activeTab === "info" ? "block" : "hidden lg:block"} space-y-8`}
              >
                <div className="space-y-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <MapPin size={20} className="text-primary" />
                    {t("address")} & {t("contact")}
                  </h2>
                  <div className="grid grid-cols-1 gap-3">
                    {place.address && (
                      <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
                        <MapPin
                          size={18}
                          className="text-muted-foreground shrink-0 mt-0.5"
                        />
                        <span className="text-sm">{place.address}</span>
                      </div>
                    )}
                    {place.phone && (
                      <a
                        href={`tel:${place.phone}`}
                        className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <Phone
                          size={18}
                          className="text-muted-foreground shrink-0"
                        />
                        <span className="text-sm">{place.phone}</span>
                      </a>
                    )}
                    {place.website && (
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <Globe
                          size={18}
                          className="text-muted-foreground shrink-0"
                        />
                        <span className="text-sm truncate">
                          {place.website.replace(/^https?:\/\//, "")}
                        </span>
                      </a>
                    )}
                    {place.email && (
                      <a
                        href={`mailto:${place.email}`}
                        className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <Mail
                          size={18}
                          className="text-muted-foreground shrink-0"
                        />
                        <span className="text-sm">{place.email}</span>
                      </a>
                    )}
                  </div>
                </div>

                {(place.openingHours || place.details?.cuisine) && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Clock size={20} className="text-primary" />
                      Details
                    </h2>
                    <div className="space-y-3">
                      {place.details?.cuisine && (
                        <div className="p-4 bg-muted/30 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                            {t("cuisine")}
                          </p>
                          <p className="text-sm">{place.details.cuisine}</p>
                        </div>
                      )}
                      {place.openingHours && (
                        <div className="p-4 bg-muted/30 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                                {t("openingHours")}
                              </p>
                              <OpeningStatusBadge
                                status={place.openingStatus}
                                size="xs"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowOSMInfo(true)}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Info size={14} />
                            </button>
                          </div>
                          {place.formattedOpeningHours ? (
                            <div className="space-y-2">
                              {place.formattedOpeningHours.map((day) => (
                                <div
                                  key={day.name}
                                  className={`flex justify-between items-center text-sm ${day.isToday ? "font-bold text-primary bg-primary/5 -mx-2 px-2 py-1 rounded-lg" : "text-muted-foreground/80"}`}
                                >
                                  <span className="w-24 shrink-0">
                                    {day.name}
                                  </span>
                                  <span className="text-right">
                                    {day.times}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-line font-mono bg-background/50 p-2 rounded border border-border/50">
                              {place.openingHours}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-muted-foreground uppercase font-bold">
                  {t("lastUpdated", {
                    date: new Date(place.lastUpdated).toLocaleDateString(),
                  })}
                </div>
              </div>

              {/* Reviews Section */}
              <div
                className={`${activeTab === "reviews" ? "block" : "hidden lg:block"} space-y-8 pb-12`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Star size={20} className="text-primary" />
                    {t("reviews")}
                  </h2>
                  <Button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    variant="secondary"
                    size="compact"
                    className="bg-primary/10 text-primary hover:bg-primary/20 rounded-lg"
                  >
                    <Plus size={14} />
                    {t("addReview")}
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    {place.reviews.length > 0 ? (
                      place.reviews.map((review) => (
                        <div
                          key={review.id}
                          className="p-4 bg-card border border-border rounded-2xl space-y-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar
                                src={review.userImage}
                                displayName={review.userDisplayName}
                                size="sm"
                                fallbackIcon={UserIcon}
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">
                                  {review.userDisplayName}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(
                                    review.createdAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                              <Star size={12} fill="currentColor" />
                              <span className="text-xs font-bold">
                                {review.rating}
                              </span>
                            </div>
                          </div>

                          {review.comment && (
                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                              "{review.comment}"
                            </p>
                          )}

                          {(review.userId === userId || isAdmin) && (
                            <div className="pt-2 flex justify-end gap-3">
                              <SubmitButton
                                type="button"
                                onClick={() => handleEditReview(review)}
                                label={t("edit")}
                                showInlineError={false}
                                successDuration={0}
                                className="text-[10px] uppercase font-bold text-muted-foreground hover:text-primary hover:underline p-0 h-auto"
                              />
                              <SubmitButton
                                type="button"
                                onClick={() => deleteReview(review.id)}
                                label={t("delete")}
                                showInlineError={false}
                                successDuration={0}
                                className="text-[10px] uppercase font-bold text-destructive hover:underline p-0 h-auto"
                              />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-10 border-2 border-dashed border-border rounded-3xl text-center text-muted-foreground text-sm">
                        {t("noReviews")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {showReviewModal && (
                <ReviewModal
                  placeId={id}
                  onClose={() => {
                    setShowReviewModal(false);
                    setEditingReview(null);
                  }}
                  onAdded={loadPlace}
                  initialData={editingReview}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {showSearchModal && (
        <DiscoverSearchModal onClose={() => setShowSearchModal(false)} />
      )}

      {showOSMInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-primary">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Info size={24} />
              </div>
              <h3 className="font-bold text-lg">{t("osmInfoTitle")}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("osmInfoText")}
            </p>
            <Button
              type="button"
              onClick={() => setShowOSMInfo(false)}
              className="w-full py-3 rounded-xl"
            >
              {tc("ok")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
