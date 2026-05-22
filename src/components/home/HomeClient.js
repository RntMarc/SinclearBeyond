"use client";

import { ChevronRight, Star, Hash } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import BirthdayModal from "@/components/birthdays/BirthdayModal";
import EventDetailModal from "@/components/calendar/EventDetailModal";
import TravelEventDetailModal from "@/components/calendar/TravelEventDetailModal";
import FeedItem from "@/components/feed/FeedItem";
import PhotoItem from "@/components/photos/PhotoItem";

export default function HomeClient({
  upcomingEvents = [],
  upcomingTrips = [],
  upcomingBirthdays = [],
  forumPosts = [],
  latestPhotos = [],
  latestMediaReviews = [],
  latestDiscoverReviews = [],
}) {
  const t = useTranslations("Home");
  const [selectedItem, setSelectedItem] = useState(null); // { type, data }

  const hasEvents = upcomingEvents.length > 0;
  const hasTrips = upcomingTrips.length > 0;
  const hasBirthdays = upcomingBirthdays.length > 0;
  const hasPhotos = latestPhotos.length > 0;
  const hasMediaReviews = latestMediaReviews.length > 0;
  const hasDiscoverReviews = latestDiscoverReviews.length > 0;

  return (
    <div className="columns-1 md:columns-2 gap-6 md:gap-10">
      {/* Upcoming Events */}
      {hasEvents && (
        <Section
          title={t("upcomingEvents")}
          href="/kalender?view=agenda"
          className="space-y-3"
        >
          {upcomingEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setSelectedItem({ type: event.type, data: event })}
              className="w-full text-left p-4 bg-card hover:bg-accent border border-border rounded-xl transition-all group flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium text-foreground">
                  {event.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(event.startAt).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "long",
                  })}
                  {event.allDay
                    ? ""
                    : `, ${new Date(event.startAt).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                </span>
              </div>
              <ChevronRight
                size={16}
                className="text-muted-foreground group-hover:translate-x-1 transition-transform"
              />
            </button>
          ))}
        </Section>
      )}

      {/* Upcoming Trips */}
      {hasTrips && (
        <Section
          title={t("upcomingTrips")}
          href="/reisen"
          className="space-y-3"
        >
          {upcomingTrips.map((trip) => (
            <Link
              key={trip.id}
              href={`/reisen/${trip.id}`}
              className="block p-4 bg-card hover:bg-accent border border-border rounded-xl transition-all group flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{trip.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(trip.start).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "long",
                  })}{" "}
                  -{" "}
                  {new Date(trip.end).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "long",
                  })}
                </span>
              </div>
              <ChevronRight
                size={16}
                className="text-muted-foreground group-hover:translate-x-1 transition-transform"
              />
            </Link>
          ))}
        </Section>
      )}

      {/* Upcoming Birthdays */}
      {hasBirthdays && (
        <Section
          title={t("upcomingBirthdays")}
          href="/geburtstage"
          className="space-y-3"
        >
          {upcomingBirthdays.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => setSelectedItem({ type: "birthday", data: user })}
              className="w-full text-left p-4 bg-card hover:bg-accent border border-border rounded-xl transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={user.image}
                  displayName={user.displayName}
                  size="sm"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {user.displayName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.birthdayDay}.{" "}
                    {new Date(0, user.birthdayMonth).toLocaleString("de-DE", {
                      month: "long",
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary">
                  {user.daysUntil === 0
                    ? "Heute! 🎉"
                    : `in ${user.daysUntil} Tage`}
                </span>
                <ChevronRight
                  size={16}
                  className="text-muted-foreground group-hover:translate-x-1 transition-transform"
                />
              </div>
            </button>
          ))}
        </Section>
      )}

      {/* Forum Posts */}
      {forumPosts.map((forum) => (
        <Section
          key={forum.id}
          title={forum.name}
          href={`/feed/${forum.id}`}
          className="space-y-6"
        >
          {forum.posts.map((post) => (
            <FeedItem key={post.id} post={post} />
          ))}
        </Section>
      ))}

      {/* Latest Photos */}
      {hasPhotos && (
        <Section
          title={t("latestPhotos")}
          href="/fotos"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {latestPhotos.map((photo) => (
            <PhotoItem key={photo.id} photo={photo} />
          ))}
        </Section>
      )}

      {/* Latest Media Reviews */}
      {hasMediaReviews && (
        <Section
          title={t("latestMediaReviews")}
          href="/kritik"
          className="space-y-3"
        >
          {latestMediaReviews.map(({ review, item, user }) => (
            <Link
              key={review.id}
              href={`/kritik/${item.type === "game" ? "spiele" : item.type === "movie" ? "filme" : "musik"}/${item.id}`}
              className="block p-4 bg-card hover:bg-accent border border-border rounded-xl transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar
                    src={user.image}
                    displayName={user.displayName}
                    size="xs"
                  />
                  <span className="text-xs font-medium text-foreground">
                    {user.displayName}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-orange-500">
                  <Star size={12} fill="currentColor" />
                  <span className="text-xs font-bold">{review.rating}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm line-clamp-1">
                  {item.title}
                </span>
                <ChevronRight
                  size={14}
                  className="text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0 ml-2"
                />
              </div>
              {review.comment && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1 italic">
                  &quot;{review.comment}&quot;
                </p>
              )}
            </Link>
          ))}
        </Section>
      )}

      {/* Latest Discover Reviews */}
      {hasDiscoverReviews && (
        <Section
          title={t("latestDiscoverReviews")}
          href="/entdecken"
          className="space-y-3"
        >
          {latestDiscoverReviews.map(({ review, place, user }) => (
            <Link
              key={review.id}
              href={`/entdecken/orte/${place.id}`}
              className="block p-4 bg-card hover:bg-accent border border-border rounded-xl transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar
                    src={user.image}
                    displayName={user.displayName}
                    size="xs"
                  />
                  <span className="text-xs font-medium text-foreground">
                    {user.displayName}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-orange-500">
                  <Star size={12} fill="currentColor" />
                  <span className="text-xs font-bold">{review.rating}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm line-clamp-1">
                  {place.name}
                </span>
                <ChevronRight
                  size={14}
                  className="text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0 ml-2"
                />
              </div>
              {review.comment && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1 italic">
                  &quot;{review.comment}&quot;
                </p>
              )}
            </Link>
          ))}
        </Section>
      )}

      {/* Modals */}
      {selectedItem?.type === "event" && (
        <EventDetailModal
          event={selectedItem.data}
          onClose={() => setSelectedItem(null)}
          onEdit={() => {}} // Home page is read-only for now
        />
      )}
      {selectedItem?.type === "travelEvent" && (
        <TravelEventDetailModal
          event={selectedItem.data}
          onClose={() => setSelectedItem(null)}
        />
      )}
      {selectedItem?.type === "birthday" && (
        <BirthdayModal
          user={selectedItem.data}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

function Section({ title, href, children, className = "" }) {
  return (
    <section className="flex flex-col break-inside-avoid mb-10">
      <Link
        href={href}
        className="group flex items-center justify-between mb-6 hover:text-primary transition-colors"
      >
        <h2 className="text-lg font-bold">{title}</h2>
        <ChevronRight
          size={20}
          className="text-muted-foreground group-hover:text-primary transition-colors"
        />
      </Link>
      <div className={className}>{children}</div>
    </section>
  );
}
