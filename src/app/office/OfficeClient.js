"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileUp, Loader2, Save } from "lucide-react";
import { ZetaHelperMain } from "zetajs/zetaHelper.js";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";

export default function OfficeClient({ user, session }) {
  const [loading, setLoading] = useState(true);
  const [filename, setFilename] = useState("");
  const helperRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initOffice = async () => {
      console.log("[Office] Initializing ZetaOffice...");
      console.log("[Office] crossOriginIsolated:", window.crossOriginIsolated);
      console.log(
        "[Office] SharedArrayBuffer available:",
        typeof SharedArrayBuffer !== "undefined",
      );

      try {
        const helper = new ZetaHelperMain("/office-worker.js", {
          wasmPkg: "free",
        });
        helperRef.current = helper;
        console.log("[Office] ZetaHelperMain instance created");

        helper.start(() => {
          setLoading(false);
          console.log("[Office] ZetaOffice started successfully");
        });
      } catch (err) {
        console.error("[Office] Failed to start ZetaOffice:", err);
      }
    };

    initOffice();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result;
      const data = new Uint8Array(arrayBuffer);
      const path = "/tmp/" + file.name;

      // Write file to virtual FS
      const FS = helperRef.current.FS;
      FS.writeFile(path, data);

      // Tell worker to open it
      helperRef.current.thrPort.postMessage({ cmd: "open", path });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSave = () => {
    if (!filename) return;
    const path = "/tmp/" + filename;
    helperRef.current.thrPort.postMessage({ cmd: "save", path });

    // Listen for saved message
    const onMessage = (e) => {
      if (e.data.cmd === "saved" && e.data.path === path) {
        helperRef.current.thrPort.removeEventListener("message", onMessage);

        // Read from FS and trigger download
        const data = helperRef.current.FS.readFile(path);
        const blob = new Blob([data], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else if (e.data.cmd === "error") {
        helperRef.current.thrPort.removeEventListener("message", onMessage);
        alert("Error saving file: " + e.data.error);
      }
    };
    helperRef.current.thrPort.addEventListener("message", onMessage);
  };

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full overflow-hidden bg-background">
        <PageHeader title="Office" subtitle="Experimentell" icon={FileUp} />

        <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="office-upload"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="compact"
              onClick={() => document.getElementById("office-upload").click()}
              disabled={loading}
            >
              <FileUp className="w-4 h-4 mr-2" />
              Laden
            </Button>

            <Button
              variant="primary"
              size="compact"
              onClick={handleSave}
              disabled={loading || !filename}
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

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Wird geladen...
            </div>
          )}
        </div>

        <div className="flex-1 relative bg-slate-900 overflow-hidden">
          {/* ZetaOffice needs a canvas with id 'qtcanvas' */}
          <canvas
            id="qtcanvas"
            className="w-full h-full block touch-none"
            onContextMenu={(e) => e.preventDefault()}
          />

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">
                ZetaOffice wird initialisiert...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Dies kann beim ersten Mal einen Moment dauern (ca. 80MB WASM).
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        #qtcanvas {
          outline: none;
        }
      `}</style>
    </AppShell>
  );
}
