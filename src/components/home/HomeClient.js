"use client";

import { CalendarCheck, ChevronRight, Hash, Star } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import BirthdayModal from "@/components/birthdays/BirthdayModal";
import EventDetailModal from "@/components/calendar/EventDetailModal";
import TravelEventDetailModal from "@/components/calendar/TravelEventDetailModal";
import FeedItem from "@/components/forum/FeedItem";
import PhotoItem from "@/components/photos/PhotoItem";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export default function HomeClient({
  upcomingEvents = [],
  upcomingTrips = [],
  upcomingBirthdays = [],
  forumPosts = [],
  latestPhotos = [],
  latestMediaReviews = [],
  latestDiscoverReviews = [],
  activePolls = [],
  finalizedPolls = [],
}) {
  const t = useTranslations("Home");
  const [selectedItem, setSelectedItem] = useState(null); // { type, data }

  const hasEvents = upcomingEvents.length > 0;
  const hasTrips = upcomingTrips.length > 0;
  const hasBirthdays = upcomingBirthdays.length > 0;
  const hasPhotos = latestPhotos.length > 0;
  const hasMediaReviews = latestMediaReviews.length > 0;
  const hasDiscoverReviews = latestDiscoverReviews.length > 0;
  const hasPolls = activePolls.length > 0 || finalizedPolls.length > 0;

  return (
    <div className="columns-1 md:columns-2 gap-8 space-y-8">
      {/* Upcoming Events */}
      {hasEvents && (
        <Section
          title={t("upcomingEvents")}
          href="/kalender?view=agenda"
          className="space-y-4"
        >
          {upcomingEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setSelectedItem({ type: event.type, data: event })}
              className="w-full text-left p-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[2rem] transition-all group flex items-center justify-between active:scale-[0.98]"
            >
              <div className="flex flex-col">
                <span className="font-bold text-foreground text-lg tracking-tight">
                  {event.title}
                </span>
                <span className="text-xs text-muted-foreground uppercase font-black tracking-widest mt-1">
                  {new Date(event.startAt).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "long",
                  })}
                  {event.allDay
                    ? ""
                    : ` • ${new Date(event.startAt).toLocaleTimeString(
                        "de-DE",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}`}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <ChevronRight size={18} />
              </div>
            </button>
          ))}
        </Section>
      )}

      {/* Polls */}
      {hasPolls && (
        <Section title={t("polls")} href="/umfrage" className="space-y-4">
          {activePolls.map((poll) => (
            <Link
              key={poll.id}
              href={`/umfrage/${poll.id}`}
              className="block p-6 bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/20 rounded-[2rem] transition-all group active:scale-[0.98] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                <CalendarCheck size={80} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-secondary mb-4">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <CalendarCheck size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    {t("activePoll")}
                  </span>
                </div>
                <span className="font-display font-bold text-xl md:text-2xl text-foreground block tracking-tighter uppercase leading-tight">
                  {poll.title}
                </span>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-bold">
                    von {poll.creatorName}
                  </span>
                  <div className="px-4 py-2 bg-secondary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_var(--secondary-glow)]">
                    Abstimmen
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {finalizedPolls.map((poll) => (
            <Link
              key={poll.id}
              href={`/umfrage/${poll.id}`}
              className="block p-6 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-[2rem] transition-all group active:scale-[0.98] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-primary">
                <CalendarCheck size={80} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-primary mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <CalendarCheck size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    {t("finalizedPoll")}
                  </span>
                </div>
                <span className="font-display font-bold text-xl md:text-2xl text-foreground block tracking-tighter uppercase leading-tight">
                  {poll.title}
                </span>
                {poll.options?.[0]?.dateValue && (
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-[10px] text-primary font-black uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                      {new Date(poll.options[0].dateValue).toLocaleDateString(
                        "de-DE",
                        { day: "2-digit", month: "long" },
                      )}
                    </span>
                    <ChevronRight size={20} className="text-primary" />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </Section>
      )}

      {/* Upcoming Trips */}
      {hasTrips && (
        <Section
          title={t("upcomingTrips")}
          href="/reisen"
          className="space-y-4"
        >
          {upcomingTrips.map((trip) => (
            <Link
              key={trip.id}
              href={`/reisen/${trip.id}`}
              className="block p-5 bg-white/5 border border-white/5 rounded-[2rem] transition-all group flex items-center justify-between active:scale-[0.98]"
            >
              <div className="flex flex-col">
                <span className="font-bold text-foreground text-lg tracking-tight">
                  {trip.name}
                </span>
                <span className="text-xs text-muted-foreground uppercase font-black tracking-widest mt-1">
                  {new Date(trip.start).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "short",
                  })}
                  {" - "}
                  {new Date(trip.end).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <ChevronRight size={18} />
              </div>
            </Link>
          ))}
        </Section>
      )}

      {/* Upcoming Birthdays */}
      {hasBirthdays && (
        <Section
          title={t("upcomingBirthdays")}
          href="/geburtstage"
          className="space-y-4"
        >
          {upcomingBirthdays.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => setSelectedItem({ type: "birthday", data: user })}
              className="w-full text-left p-5 bg-accent/5 border border-accent/10 rounded-[2rem] transition-all group flex items-center justify-between active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <Avatar
                  src={user.image}
                  displayName={user.displayName}
                  size="md"
                  className="ring-2 ring-accent/20 ring-offset-4 ring-offset-background"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-foreground text-lg tracking-tight">
                    {user.displayName}
                  </span>
                  <span className="text-xs text-accent font-black uppercase tracking-widest mt-0.5">
                    {user.birthdayDay}.{" "}
                    {new Date(0, user.birthdayMonth).toLocaleString("de-DE", {
                      month: "long",
                    })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={cn(
                    "text-[10px] font-black uppercase px-2 py-1 rounded-sm rotate-3 shadow-lg",
                    user.daysUntil === 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/10 text-white",
                  )}
                >
                  {user.daysUntil === 0
                    ? "Heute! 🎉"
                    : `${user.daysUntil} Tage`}
                </span>
              </div>
            </button>
          ))}
        </Section>
      )}

      {/* Forum Posts */}
      {forumPosts.map((forum) => (
        <Section
          key={forum.id}
          title={forum.name || t("latestPosts")}
          href={`/forum/${forum.id}`}
          className="space-y-6"
        >
          {forum.posts.map((post) => (
            <div key={post.id} className="glass-card rounded-[2rem] p-1">
              <FeedItem post={post} />
            </div>
          ))}
        </Section>
      ))}

      {/* Latest Photos */}
      {hasPhotos && (
        <Section
          title={t("latestPhotos")}
          href="/fotos"
          className="grid grid-cols-2 gap-4"
        >
          {latestPhotos.slice(0, 4).map((photo) => (
            <PhotoItem key={photo.id} photo={photo} />
          ))}
        </Section>
      )}

      {/* Latest Media Reviews */}
      {hasMediaReviews && (
        <Section
          title={t("latestMediaReviews")}
          href="/kritik"
          className="space-y-4"
        >
          {latestMediaReviews.map(({ review, item, user }) => (
            <Link
              key={review.id}
              href={`/kritik/${item.type === "game" ? "spiele" : item.type === "movie" ? "filme" : "musik"}/${item.id}`}
              className="block p-5 bg-white/5 border border-white/5 rounded-[2rem] transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={user.image}
                    displayName={user.displayName}
                    size="xs"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {user.displayName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-full text-primary">
                  <Star size={10} fill="currentColor" />
                  <span className="text-[10px] font-black">
                    {review.rating}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg tracking-tight line-clamp-1">
                  {item.title}
                </span>
                <ChevronRight
                  size={16}
                  className="text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0 ml-2"
                />
              </div>
            </Link>
          ))}
        </Section>
      )}

      {/* Latest Discover Reviews */}
      {hasDiscoverReviews && (
        <Section
          title={t("latestDiscoverReviews")}
          href="/entdecken"
          className="space-y-4"
        >
          {latestDiscoverReviews.map(({ review, place, user }) => (
            <Link
              key={review.id}
              href={`/entdecken/orte/${place.id}`}
              className="block p-5 bg-white/5 border border-white/5 rounded-[2rem] transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={user.image}
                    displayName={user.displayName}
                    size="xs"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {user.displayName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-full text-primary">
                  <Star size={10} fill="currentColor" />
                  <span className="text-[10px] font-black">
                    {review.rating}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg tracking-tight line-clamp-1">
                  {place.name}
                </span>
                <ChevronRight
                  size={16}
                  className="text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0 ml-2"
                />
              </div>
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
    <Card className="break-inside-avoid shadow-2xl">
      <Link
        href={href}
        className="group flex items-center justify-between mb-8"
      >
        <h2 className="text-xl md:text-2xl font-display font-bold tracking-tighter uppercase leading-none">
          <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            {title}
          </span>
        </h2>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
          <ChevronRight size={16} />
        </div>
      </Link>
      <div className={className}>{children}</div>
    </Card>
  );
}
