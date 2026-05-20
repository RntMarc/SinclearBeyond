"use client";

import { FileUp, Save } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";

// Dynamic import with ssr: false for components that use browser APIs
const DocxEditor = dynamic(
  () => import("@eigenpal/docx-editor-react").then((mod) => mod.DocxEditor),
  { ssr: false },
);

// We still need to import styles
import "@eigenpal/docx-editor-react/styles.css";

export default function OfficeClient({ user, session }) {
  const [buffer, setBuffer] = useState(null);
  const [filename, setFilename] = useState("");
  const editorRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setBuffer(reader.result);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSave = async () => {
    if (!editorRef.current) return;
    const saved = await editorRef.current.save();
    if (!saved) return;

    const blob = new Blob([saved], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "dokument.docx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full overflow-hidden bg-background">
        <PageHeader title="Office" subtitle="Client-seitig" icon={FileUp} />

        <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="office-upload"
              className="hidden"
              accept=".docx"
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

            <Button
              variant="primary"
              size="compact"
              onClick={handleSave}
              disabled={!buffer}
            >
              <Save className="w-4 h-4 mr-2" />
              Speichern & Download
            </Button>
          </div>

          {filename && (
            <div className="text-sm font-medium truncate flex-1">
              Aktuelle Datei:{" "}
              <span className="text-muted-foreground">{filename}</span>
            </div>
          )}
        </div>

        <div className="flex-1 relative bg-slate-900 overflow-hidden">
          <DocxEditor
            ref={editorRef}
            documentBuffer={buffer}
            showToolbar
            showRuler
            showZoomControl
          />
        </div>
      </div>

      <style jsx global>{`
        .docx-editor-container {
          height: 100%;
        }
      `}</style>
    </AppShell>
  );
}
