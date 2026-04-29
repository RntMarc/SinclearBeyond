"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import AppShell from "@/components/layout/Appshell";
import TripFormModal from "@/components/travel/TripFormModal";

export default function AdminPage({ user, session }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <AppShell user={user} session={session}>
      <div className="max-w-4xl mx-auto w-full px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4 font-medium">
              Administration
            </p>
            <h1 className="text-4xl font-light text-foreground">Übersicht</h1>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            Reise anlegen
          </button>
        </div>

        <div className="grid gap-6">
          <div className="bg-sidebar border border-sidebar-border rounded-2xl p-8 text-center">
            <h2 className="text-lg font-medium mb-2">
              Willkommen im Admin-Bereich
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Hier kannst du globale Einstellungen vornehmen und neue Inhalte
              wie Reisen erstellen.
            </p>
          </div>
        </div>

        {showModal && (
          <TripFormModal
            onClose={() => setShowModal(false)}
            onCreated={() => {
              // Optionally show a success message or refresh data
              console.log("Trip created");
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
