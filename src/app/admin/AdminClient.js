"use client";

import {
  Hotel,
  Palette,
  Plane,
  Plus,
  Users,
  Webhook,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/Appshell";
import { useTheme } from "@/components/layout/ThemeProvider";
import AccommodationAdminModal from "@/components/travel/AccommodationAdminModal";
import AccommodationFormModal from "@/components/travel/AccommodationFormModal";
import TripAdminModal from "@/components/travel/TripAdminModal";
import TripFormModal from "@/components/travel/TripFormModal";

export default function AdminPage({ user, session }) {
  const { adminEffectsEnabled, setAdminEffectsEnabled } = useTheme();
  const [activeTab, setActiveTab] = useState("reisen");
  const [showTripModal, setShowTripModal] = useState(false);
  const [showAccommodationModal, setShowAccommodationModal] = useState(false);
  const [trips, setTrips] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [editingTrip, setEditingTrip] = useState(null);
  const [editingAccommodation, setEditingAccommodation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tripsRes, accommodationsRes] = await Promise.all([
        fetch("/api/reisen/data"),
        fetch("/api/travel/accommodations"),
      ]);

      if (tripsRes.ok) setTrips(await tripsRes.json());
      if (accommodationsRes.ok)
        setAccommodations(await accommodationsRes.json());
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
    { id: "users", label: "Nutzer", icon: Users },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "system", label: "System", icon: Palette },
  ];

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <header className="px-6 py-8 md:px-10 md:py-12 bg-card border-b border-border shrink-0">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
                Verwaltung
              </p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                Admin-Panel
              </h1>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowAccommodationModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border rounded-xl text-sm font-medium hover:bg-sidebar-accent/80 transition-all"
              >
                <Hotel size={18} />
                Unterkunft anlegen
              </button>

              <button
                type="button"
                onClick={() => setShowTripModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                <Plus size={18} />
                Reise anlegen
              </button>
            </div>
          </div>
        </header>

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
            {activeTab === "reisen" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Reisen Spalte */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-light flex items-center gap-2">
                      <Plane className="text-primary" size={20} />
                      Reisen
                    </h2>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {trips.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {loading
                      ? <div className="animate-pulse space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 bg-muted rounded-xl" />
                          ))}
                        </div>
                      : trips.length > 0
                        ? trips.map((trip) => (
                            <div
                              key={trip.id}
                              className="flex items-center justify-between p-4 bg-sidebar border border-sidebar-border rounded-xl"
                            >
                              <div>
                                <h3 className="font-medium text-sm">
                                  {trip.name}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(trip.start).toLocaleDateString(
                                    "de-DE",
                                  )}{" "}
                                  –{" "}
                                  {new Date(trip.end).toLocaleDateString(
                                    "de-DE",
                                  )}
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
                        : <div className="p-8 text-center bg-sidebar border border-sidebar-border rounded-xl text-muted-foreground text-sm">
                            Keine Reisen vorhanden.
                          </div>}
                  </div>
                </div>

                {/* Unterkünfte Spalte */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-light flex items-center gap-2">
                      <Hotel className="text-primary" size={20} />
                      Unterkünfte
                    </h2>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {accommodations.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {loading
                      ? <div className="animate-pulse space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 bg-muted rounded-xl" />
                          ))}
                        </div>
                      : accommodations.length > 0
                        ? accommodations.map((acc) => (
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
                        : <div className="p-8 text-center bg-sidebar border border-sidebar-border rounded-xl text-muted-foreground text-sm">
                            Keine Unterkünfte vorhanden.
                          </div>}
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
          />
        )}

        {editingAccommodation && (
          <AccommodationAdminModal
            accommodation={editingAccommodation}
            onClose={() => setEditingAccommodation(null)}
            onUpdated={fetchData}
          />
        )}
      </div>
    </AppShell>
  );
}
