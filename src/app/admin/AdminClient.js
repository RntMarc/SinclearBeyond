"use client";

import {
  Banknote,
  BellRing,
  CalendarDays,
  Hash,
  Hotel,
  Lock,
  Newspaper,
  Palette,
  Plane,
  Plus,
  Users,
  Webhook,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ForumFormModal from "@/components/admin/ForumFormModal";
import RssSourceFormModal from "@/components/admin/RssSourceFormModal";
import SubscriptionFormModal from "@/components/admin/SubscriptionFormModal";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { useTheme } from "@/components/layout/ThemeProvider";
import NotificationTestModal from "@/components/admin/NotificationTestModal";
import AccommodationAdminModal from "@/components/travel/AccommodationAdminModal";
import AccommodationFormModal from "@/components/travel/AccommodationFormModal";
import TravelEventFormModal from "@/components/travel/TravelEventFormModal";
import TripAdminModal from "@/components/travel/TripAdminModal";
import TripFormModal from "@/components/travel/TripFormModal";

export default function AdminPage({ user, session }) {
  const { adminEffectsEnabled, setAdminEffectsEnabled } = useTheme();
  const [activeTab, setActiveTab] = useState("reisen");
  const [showTripModal, setShowTripModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAccommodationModal, setShowAccommodationModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showForumModal, setShowForumModal] = useState(false);
  const [showRssModal, setShowRssModal] = useState(false);
  const [trips, setTrips] = useState([]);
  const [standaloneEvents, setStandaloneEvents] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [forums, setForums] = useState([]);
  const [rssSources, setRssSources] = useState([]);
  const hasSubs = useMemo(
    () => subscriptions.some((s) => s.isParticipant),
    [subscriptions],
  );
  const [editingTrip, setEditingTrip] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingAccommodation, setEditingAccommodation] = useState(null);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [editingForum, setEditingForum] = useState(null);
  const [editingRssSource, setEditingRssSource] = useState(null);
  const [showTestNotificationModal, setShowTestNotificationModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        tripsRes,
        accommodationsRes,
        subscriptionsRes,
        eventsRes,
        forumsRes,
        rssRes,
      ] = await Promise.all([
        fetch("/api/reisen/data"),
        fetch("/api/travel/accommodations"),
        fetch("/api/subscriptions"),
        fetch("/api/reisen/data?standalone=1"),
        fetch("/api/forums"),
        fetch("/api/admin/news/sources"),
      ]);

      if (tripsRes.ok) setTrips(await tripsRes.json());
      if (eventsRes.ok) setStandaloneEvents(await eventsRes.json());
      if (accommodationsRes.ok)
        setAccommodations(await accommodationsRes.json());
      if (subscriptionsRes.ok) setSubscriptions(await subscriptionsRes.json());
      if (forumsRes.ok) setForums(await forumsRes.json());
      if (rssRes.ok) setRssSources(await rssRes.json());
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    { id: "reisen", label: "Reisen", icon: Plane },
    { id: "subscriptions", label: "Abos", icon: Banknote },
    { id: "forums", label: "Foren", icon: Hash },
    { id: "news", label: "Aktuell", icon: Newspaper },
    { id: "notifications", label: "Benachrichtigungen", icon: BellRing },
    { id: "users", label: "Nutzer", icon: Users },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "system", label: "System", icon: Palette },
  ];

  return (
    <AppShell user={{ ...user, hasSubscriptions: hasSubs }} session={session}>
      <div className="flex flex-col h-full bg-background">
        <PageHeader subtitle="Verwaltung" title="Admin-Panel" icon={Lock} />

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            {/* Tabs */}
            <div className="flex border-b border-border mb-8 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "news" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-light flex items-center gap-2">
                      <Newspaper className="text-primary" size={20} />
                      RSS-Quellen
                    </h2>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {rssSources.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRssModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border rounded-xl text-sm font-medium hover:bg-sidebar-accent/80 transition-all"
                  >
                    <Plus size={16} />
                    Quelle anlegen
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading ? (
                    <div className="animate-pulse space-y-3 col-span-full">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-muted rounded-xl" />
                      ))}
                    </div>
                  ) : rssSources.length > 0 ? (
                    rssSources.map((source) => (
                      <div
                        key={source.id}
                        className="flex items-center justify-between p-4 bg-sidebar border border-sidebar-border rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground overflow-hidden">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${new URL(source.url).hostname}&sz=64`}
                              alt={source.name}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                            <div className="hidden w-full h-full items-center justify-center">
                              <Newspaper size={20} />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium text-sm">
                              {source.name}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {source.url}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                              {source.itemsPerPage} Artikel pro Ladegang
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingRssSource(source)}
                          className="p-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Wrench size={18} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-8 text-center bg-sidebar border border-sidebar-border rounded-xl text-muted-foreground text-sm">
                      Keine RSS-Quellen vorhanden.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "forums" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-light flex items-center gap-2">
                      <Hash className="text-primary" size={20} />
                      Foren
                    </h2>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {forums.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForumModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border rounded-xl text-sm font-medium hover:bg-sidebar-accent/80 transition-all"
                  >
                    <Plus size={16} />
                    Forum anlegen
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading ? (
                    <div className="animate-pulse space-y-3 col-span-full">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-muted rounded-xl" />
                      ))}
                    </div>
                  ) : forums.length > 0 ? (
                    forums.map((forum) => (
                      <div
                        key={forum.id}
                        className="flex items-center justify-between p-4 bg-sidebar border border-sidebar-border rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            {forum.image ? (
                              <img
                                src={forum.image}
                                alt={forum.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <Hash size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-sm">
                              {forum.name}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {forum.description || "Keine Beschreibung"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingForum(forum)}
                          className="p-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Wrench size={18} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-8 text-center bg-sidebar border border-sidebar-border rounded-xl text-muted-foreground text-sm">
                      Keine Foren vorhanden.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "subscriptions" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-light flex items-center gap-2">
                      <Banknote className="text-primary" size={20} />
                      Abonnements
                    </h2>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {subscriptions.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSubscriptionModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border rounded-xl text-sm font-medium hover:bg-sidebar-accent/80 transition-all"
                  >
                    <Plus size={16} />
                    Abo anlegen
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading ? (
                    <div className="animate-pulse space-y-3 col-span-full">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-muted rounded-xl" />
                      ))}
                    </div>
                  ) : subscriptions.length > 0 ? (
                    subscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-4 bg-sidebar border border-sidebar-border rounded-xl"
                      >
                        <div>
                          <h3 className="font-medium text-sm">{sub.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(
                              sub.billingPeriodStart,
                            ).toLocaleDateString("de-DE")}{" "}
                            –{" "}
                            {new Date(sub.billingPeriodEnd).toLocaleDateString(
                              "de-DE",
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingSubscription(sub)}
                          className="p-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Wrench size={18} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-8 text-center bg-sidebar border border-sidebar-border rounded-xl text-muted-foreground text-sm">
                      Keine Abonnements vorhanden.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "reisen" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Reisen Spalte */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-light flex items-center gap-2">
                        <Plane className="text-primary" size={20} />
                        Reisen
                      </h2>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {trips.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowTripModal(true)}
                      className="flex items-center justify-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity shadow-sm"
                    >
                      <Plus size={14} />
                      Reise
                    </button>
                  </div>

                  <div className="space-y-3">
                    {loading ? (
                      <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-20 bg-muted rounded-xl" />
                        ))}
                      </div>
                    ) : trips.length > 0 ? (
                      trips.map((trip) => (
                        <div
                          key={trip.id}
                          className="flex items-center justify-between p-4 bg-sidebar border border-sidebar-border rounded-xl"
                        >
                          <div>
                            <h3 className="font-medium text-sm">{trip.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {new Date(trip.start).toLocaleDateString("de-DE")}{" "}
                              – {new Date(trip.end).toLocaleDateString("de-DE")}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingTrip(trip)}
                            className="p-2 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Wrench size={18} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-sidebar border border-sidebar-border rounded-xl text-muted-foreground text-sm">
                        Keine Reisen vorhanden.
                      </div>
                    )}
                  </div>

                  {/* Eigenständige Events */}
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-light flex items-center gap-2">
                        <CalendarDays className="text-primary" size={20} />
                        Events
                      </h2>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {standaloneEvents.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowEventModal(true)}
                      className="flex items-center justify-center gap-2 px-3 py-1.5 bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border rounded-lg text-xs font-medium hover:bg-sidebar-accent/80 transition-all"
                    >
                      <Plus size={14} />
                      Event
                    </button>
                  </div>

                  <div className="space-y-3">
                    {loading ? (
                      <div className="animate-pulse space-y-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-20 bg-muted rounded-xl" />
                        ))}
                      </div>
                    ) : standaloneEvents.length > 0 ? (
                      standaloneEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-4 bg-sidebar border border-sidebar-border rounded-xl"
                        >
                          <div>
                            <h3 className="font-medium text-sm">
                              {event.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.start).toLocaleDateString(
                                "de-DE",
                              )}{" "}
                              –{" "}
                              {new Date(event.end).toLocaleDateString("de-DE")}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingEvent(event)}
                            className="p-2 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Wrench size={18} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-sidebar border border-sidebar-border rounded-xl text-muted-foreground text-sm">
                        Keine eigenständigen Events vorhanden.
                      </div>
                    )}
                  </div>
                </div>

                {/* Unterkünfte Spalte */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-light flex items-center gap-2">
                        <Hotel className="text-primary" size={20} />
                        Unterkünfte
                      </h2>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {accommodations.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAccommodationModal(true)}
                      className="flex items-center justify-center gap-2 px-3 py-1.5 bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border rounded-lg text-xs font-medium hover:bg-sidebar-accent/80 transition-all"
                    >
                      <Plus size={14} />
                      Unterkunft
                    </button>
                  </div>

                  <div className="space-y-3">
                    {loading ? (
                      <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-20 bg-muted rounded-xl" />
                        ))}
                      </div>
                    ) : accommodations.length > 0 ? (
                      accommodations.map((acc) => (
                        <div
                          key={acc.id}
                          className="flex items-center justify-between p-4 bg-sidebar border border-sidebar-border rounded-xl"
                        >
                          <div className="min-w-0">
                            <h3 className="font-medium text-sm truncate">
                              {acc.name}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {acc.address || "Keine Adresse"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingAccommodation(acc)}
                            className="p-2 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Wrench size={18} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-sidebar border border-sidebar-border rounded-xl text-muted-foreground text-sm">
                        Keine Unterkünfte vorhanden.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "system" && (
              <div className="bg-sidebar border border-sidebar-border rounded-2xl p-8">
                <h2 className="text-xl font-light mb-6 flex items-center gap-2">
                  <Palette className="text-primary" size={20} />
                  System-Einstellungen (Temporär)
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                    <div>
                      <h3 className="font-medium text-sm">
                        Saisonale Effekte erzwingen
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Aktiviert Pride- und Schnee-Effekte unabhängig vom
                        aktuellen Datum (nur für dich sichtbar).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setAdminEffectsEnabled(!adminEffectsEnabled)
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        adminEffectsEnabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          adminEffectsEnabled
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-sidebar border border-sidebar-border rounded-2xl p-8">
                <h2 className="text-xl font-light mb-6 flex items-center gap-2">
                  <BellRing className="text-primary" size={20} />
                  Test-Benachrichtigungen
                </h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-lg">
                  Versende eine Test-Benachrichtigung an ausgewählte User.
                  Die Benachrichtigung wird sowohl im internen System als auch
                  als PWA-Push-Benachrichtigung zugestellt.
                </p>
                <button
                  type="button"
                  onClick={() => setShowTestNotificationModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <BellRing size={16} />
                  Test-Benachrichtigung senden
                </button>
              </div>
            )}

            {(activeTab === "users" || activeTab === "webhooks") && (
              <div className="bg-sidebar border border-sidebar-border rounded-2xl p-12 text-center">
                <h2 className="text-lg font-medium mb-2">
                  Hier entsteht etwas Neues
                </h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Dieser Bereich wird in Kürze verfügbar sein.
                </p>
              </div>
            )}
          </div>
        </div>

        {showTripModal && (
          <TripFormModal
            onClose={() => setShowTripModal(false)}
            onCreated={fetchData}
            timezone={session.timezone}
          />
        )}

        {showEventModal && (
          <TravelEventFormModal
            onClose={() => setShowEventModal(false)}
            onUpdated={fetchData}
            timezone={session.timezone}
          />
        )}

        {showAccommodationModal && (
          <AccommodationFormModal
            onClose={() => setShowAccommodationModal(false)}
            onCreated={fetchData}
          />
        )}

        {editingTrip && (
          <TripAdminModal
            trip={editingTrip}
            onClose={() => setEditingTrip(null)}
            onUpdated={fetchData}
            timezone={session.timezone}
          />
        )}

        {editingEvent && (
          <TravelEventFormModal
            event={editingEvent}
            onClose={() => setEditingEvent(null)}
            onUpdated={fetchData}
            timezone={session.timezone}
          />
        )}

        {showSubscriptionModal && (
          <SubscriptionFormModal
            onClose={() => setShowSubscriptionModal(false)}
            onCreated={fetchData}
          />
        )}

        {editingSubscription && (
          <SubscriptionFormModal
            subscription={editingSubscription}
            onClose={() => setEditingSubscription(null)}
            onUpdated={fetchData}
          />
        )}

        {editingAccommodation && (
          <AccommodationAdminModal
            accommodation={editingAccommodation}
            onClose={() => setEditingAccommodation(null)}
            onUpdated={fetchData}
          />
        )}

        {showForumModal && (
          <ForumFormModal
            onClose={() => setShowForumModal(false)}
            onUpdated={fetchData}
          />
        )}

        {editingForum && (
          <ForumFormModal
            forum={editingForum}
            onClose={() => setEditingForum(null)}
            onUpdated={fetchData}
          />
        )}

        {showRssModal && (
          <RssSourceFormModal
            onClose={() => setShowRssModal(false)}
            onUpdated={fetchData}
          />
        )}

        {editingRssSource && (
          <RssSourceFormModal
            source={editingRssSource}
            onClose={() => setEditingRssSource(null)}
            onUpdated={fetchData}
          />
        )}

        {showTestNotificationModal && (
          <NotificationTestModal
            onClose={() => setShowTestNotificationModal(false)}
          />
        )}
      </div>
    </AppShell>
  );
}
