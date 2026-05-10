"use client";

import {
  ArrowLeft,
  Bookmark,
  Check,
  Clock,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCcw,
  Share2,
  Star,
  Trash2,
  TreePine,
  User as UserIcon,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import ReviewModal from "@/components/discover/ReviewModal";
import SimpleOSM from "@/components/discover/SimpleOSM";
import SubPageHeader from "@/components/layout/SubPageHeader";

export default function PlaceDetailPage({ id, userId, isAdmin }) {
  const t = useTranslations("Discover");
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
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
      const res = await fetch("/api/discover/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: id }),
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarked(data.bookmarked);
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
    if (!confirm(t("deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/discover/places/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push(`/entdecken/${place.category}`);
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (_err) {
      alert(t("errorUpdate"));
    }
  }

  async function deleteReview(reviewId) {
    if (!confirm(t("deleteReviewConfirm"))) return;
    try {
      const res = await fetch(`/api/discover/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadPlace();
      }
    } catch (_err) {
      alert(t("errorUpdate"));
    }
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
        backHref={`/entdecken/${place.category === "gastronomy" ? "gastronomie" : place.category}`}
        subtitle={t(`categories.${place.category}`)}
        title={place.name}
        icon={place.category === "gastronomy" ? Utensils : TreePine}
      >
        <button
          type="button"
          onClick={sharePlace}
          className="p-2 hover:bg-muted rounded-full transition-colors relative"
          title={t("share")}
        >
          {copied
            ? <Check size={20} className="text-green-500" />
            : <Share2 size={20} />}
          {copied && (
            <span className="absolute -bottom-8 right-0 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-lg border border-border whitespace-nowrap animate-in fade-in zoom-in duration-200">
              {t("linkCopied")}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={toggleBookmark}
          disabled={bookmarkLoading}
          className={`p-2 hover:bg-muted rounded-full transition-colors ${bookmarked ? "text-primary" : ""}`}
          title={t("bookmarks")}
        >
          <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
        </button>
        {(place.creatorId === userId || isAdmin) && (
          <button
            type="button"
            onClick={deletePlace}
            className="p-2 hover:bg-muted rounded-full transition-colors text-destructive"
            title="Löschen"
          >
            <Trash2 size={20} />
          </button>
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
                    <button
                      type="button"
                      onClick={refreshFromOSM}
                      disabled={updating}
                      className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      <RefreshCcw
                        size={16}
                        className={updating ? "animate-spin" : ""}
                      />
                    </button>
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
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3">
                            {t("openingHours")}
                          </p>
                          {place.formattedOpeningHours
                            ? <div className="space-y-2">
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
                            : <p className="text-sm whitespace-pre-line">
                                {place.openingHours}
                              </p>}
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
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Plus size={14} />
                    {t("addReview")}
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    {place.reviews.length > 0
                      ? place.reviews.map((review) => (
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
                              <div className="pt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => deleteReview(review.id)}
                                  className="text-[10px] uppercase font-bold text-destructive hover:underline"
                                >
                                  {t("delete")}
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      : <div className="p-10 border-2 border-dashed border-border rounded-3xl text-center text-muted-foreground text-sm">
                          {t("noReviews")}
                        </div>}
                  </div>
                </div>
              </div>
              {showReviewModal && (
                <ReviewModal
                  placeId={id}
                  onClose={() => setShowReviewModal(false)}
                  onAdded={loadPlace}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
