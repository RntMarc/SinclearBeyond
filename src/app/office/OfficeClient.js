"use client";

import { useState } from "react";
import { FileText, FileUp, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import "@eigenpal/docx-editor-react/styles.css";

const DocxEditor = dynamic(
  () => import("@eigenpal/docx-editor-react").then((mod) => mod.DocxEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full bg-background/80 backdrop-blur-sm">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Editor wird geladen...</p>
      </div>
    ),
  },
);

export default function OfficeClient({ user, session }) {
  const [buffer, setBuffer] = useState(null);
  const [filename, setFilename] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    try {
      const arrayBuffer = await file.arrayBuffer();
      setBuffer(arrayBuffer);
    } catch (err) {
      console.error("Error loading file:", err);
    }
  };

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full overflow-hidden bg-background">
        <PageHeader title="Office" subtitle="DOCX Editor" icon={FileText} />

        <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="office-upload"
              accept=".docx"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="compact"
              onClick={() => document.getElementById("office-upload").click()}
            >
              <FileUp className="w-4 h-4 mr-2" />
              Laden
            </Button>
          </div>

          {filename && (
            <div className="text-sm font-medium truncate flex-1">
              Aktuelle Datei:{" "}
              <span className="text-muted-foreground">{filename}</span>
            </div>
          )}
        </div>

        <div className="flex-1 relative overflow-hidden bg-muted/5">
          {buffer ? (
            <div className="w-full h-full">
              <DocxEditor documentBuffer={buffer} mode="editing" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <FileUp className="w-10 h-10 opacity-40" />
              </div>
              <p className="text-xl font-semibold text-foreground">
                Kein Dokument ausgewählt
              </p>
              <p className="max-w-xs mt-2 text-muted-foreground">
                Lade eine .docx Datei hoch, um mit der Bearbeitung zu beginnen.
                Der Editor läuft vollständig in deinem Browser.
              </p>
              <Button
                variant="primary"
                className="mt-8"
                onClick={() => document.getElementById("office-upload").click()}
              >
                Datei auswählen
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
