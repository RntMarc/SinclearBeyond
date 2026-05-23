"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import AppShell from "@/components/layout/Appshell";
import SubPageHeader from "@/components/layout/SubPageHeader";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Save,
  History,
  Download,
  FileUp,
  Loader2,
  Users,
  FileText,
  Type,
  Code,
  Heading1,
  Heading2,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { InlineError } from "@/components/ui/InlineError";
import mammoth from "mammoth";
import { jsPDF } from "jspdf";
import { asBlob } from "html-docx-js-typescript";
import { debounce } from "lodash-es";

export default function EditorClient({ user, session, docId }) {
  const t = useTranslations("Office");
  const [docMetadata, setDocMetadata] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [userColor, setUserColor] = useState("#7c3aed");

  const ydocRef = useRef(new Y.Doc());
  const lastSyncRef = useRef(0);
  const lastSaveRef = useRef(0);

  const fetchMetadata = useCallback(async () => {
    try {
      const res = await fetch(`/api/office/documents/${docId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(`[Office] Fetch metadata for ${docId} failed:`, res.status, errorData);
        throw new Error(t("errorNotFound"));
      }
      const data = await res.json();
      setDocMetadata(data);
    } catch (err) {
      console.error(`[Office] Fetch metadata for ${docId} exception:`, err);
      setError(err.message);
    }
  }, [docId, t]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/office/documents/${docId}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error(`[Office] Fetch history for ${docId} failed:`, res.status, errorData);
      }
    } catch (e) {
      console.error(`[Office] Fetch history for ${docId} exception:`, e);
    }
  }, [docId]);

  const sync = useCallback(
    async (update = null) => {
      setSyncing(true);
      try {
        const body = { presence: true };
        if (update) {
          body.update = Buffer.from(update).toString("base64");
        }

        const res = await fetch(`/api/office/documents/${docId}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const data = await res.json();
          setCollaborators(data.collaborators || []);

          const currentCollaborator = data.collaborators?.find(
            (c) => c.userId === user.id,
          );
          if (currentCollaborator) {
            setUserColor(currentCollaborator.color);
          }

          if (data.content && !update) {
            Y.applyUpdate(
              ydocRef.current,
              Buffer.from(data.content, "base64"),
              "server",
            );
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error(`[Office] Sync for ${docId} failed:`, res.status, errorData);
        }
      } catch (e) {
        console.error(`[Office] Sync for ${docId} exception:`, e);
      } finally {
        setSyncing(false);
        lastSyncRef.current = Date.now();
      }
    },
    [docId, user.id],
  );

  const debouncedSync = useRef(
    debounce((update) => sync(update), 10000, { maxWait: 15000 }),
  ).current;

  const createVersion = useCallback(
    async (label = null) => {
      if (!editor) return;
      try {
        const content = Buffer.from(
          Y.encodeStateAsUpdate(ydocRef.current),
        ).toString("base64");
        const res = await fetch(`/api/office/documents/${docId}/history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, label }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error(`[Office] Create version for ${docId} failed:`, res.status, errorData);
        }
        fetchHistory();
      } catch (e) {
        console.error(`[Office] Create version for ${docId} exception:`, e);
      }
    },
    [docId, fetchHistory],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Collaboration.configure({
        document: ydocRef.current,
      }),
      CollaborationCursor.configure({
        provider: {
          on: () => {},
          off: () => {},
          awareness: {
            getStates: () => new Map(),
            setLocalStateField: () => {},
            on: () => {},
            off: () => {},
          },
        },
        user: {
          name: user.displayName,
          color: userColor,
        },
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[600px] p-12 bg-card rounded-b-xl border border-border shadow-inner",
      },
    },
  });

  useEffect(() => {
    fetchMetadata();
    fetchHistory();
    sync();

    const interval = setInterval(() => {
      if (Date.now() - lastSyncRef.current > 5000) {
        sync();
      }
    }, 5000);

    const onUpdate = (update, origin) => {
      if (origin !== "server") {
        debouncedSync(update);
      }
    };
    ydocRef.current.on("update", onUpdate);

    return () => {
      clearInterval(interval);
      ydocRef.current.off("update", onUpdate);
      debouncedSync.cancel();
    };
  }, [docId, sync, fetchMetadata, fetchHistory, debouncedSync]);

  const handleExport = async (format) => {
    if (!editor) return;
    const html = editor.getHTML();
    const title = docMetadata?.title || "dokument";

    if (format === "html") {
      const blob = new Blob([html], { type: "text/html" });
      downloadBlob(blob, `${title}.html`);
    } else if (format === "txt") {
      const blob = new Blob([editor.getText()], { type: "text/plain" });
      downloadBlob(blob, `${title}.txt`);
    } else if (format === "pdf") {
      const doc = new jsPDF();
      doc.text(editor.getText(), 10, 10);
      doc.save(`${title}.pdf`);
    } else if (format === "docx") {
      const content = await asBlob(html);
      downloadBlob(content, `${title}.docx`);
    } else if (format === "odt") {
      alert(
        "ODT Export wird vorbereitet... (In dieser Version als Word-Download verfügbar)",
      );
      const content = await asBlob(html);
      downloadBlob(content, `${title}.odt`);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file || !editor) return;

    if (file.name.endsWith(".docx") || file.name.endsWith(".odt")) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
            const result = await mammoth.convertToHtml({
              arrayBuffer: event.target.result,
            });
            editor.commands.setContent(result.value);
        } catch (err) {
            console.error("Mammoth import error", err);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        editor.commands.setContent(event.target.result);
      };
      reader.readAsText(file);
    } else if (file.name.endsWith(".html")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        editor.commands.setContent(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreVersion = (v) => {
    if (confirm(t("restoreConfirm"))) {
      Y.applyUpdate(
        ydocRef.current,
        Buffer.from(v.content, "base64"),
        "server",
      );
      sync(Y.encodeStateAsUpdate(ydocRef.current));
      setShowHistory(false);
    }
  };

  if (error)
    return (
      <AppShell user={user} session={session}>
        <div className="p-6">
          <InlineError message={error} />
          <Button
            className="mt-4"
            onClick={() => (window.location.href = "/office")}
          >
            Zurück zur Übersicht
          </Button>
        </div>
      </AppShell>
    );

  return (
    <AppShell user={user} session={session}>
      <div className="flex h-full bg-background overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <SubPageHeader
            title={docMetadata?.title || t("loading")}
            backHref="/office"
          />

          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto pb-20">
              <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/80 border border-border rounded-t-xl sticky top-0 z-10 backdrop-blur-md shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 1 }).run()
                  }
                  className={
                    editor?.isActive("heading", { level: 1 })
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }
                >
                  <Heading1 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  className={
                    editor?.isActive("heading", { level: 2 })
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }
                >
                  <Heading2 className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={
                    editor?.isActive("bold")
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={
                    editor?.isActive("italic")
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                  className={
                    editor?.isActive("bulletList")
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    editor?.chain().focus().toggleOrderedList().run()
                  }
                  className={
                    editor?.isActive("orderedList")
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>

                <div className="flex-1" />

                <div className="flex -space-x-1.5 mr-3">
                  {collaborators.map((c) => (
                    <div
                      key={c.userId}
                      className="w-8 h-8 rounded-full ring-2 ring-background flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0"
                      style={{ backgroundColor: c.color }}
                      title={c.displayName}
                    >
                      {c.displayName.substring(0, 2).toUpperCase()}
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="compact"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <History className="w-4 h-4 mr-2" />
                  {t("history")}
                </Button>
              </div>

              <EditorContent editor={editor} />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  {syncing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  )}
                  {syncing ? t("syncing") : t("allSaved")}
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t("export")}:</span>
                    <button
                      onClick={() => handleExport("odt")}
                      className="hover:text-primary underline"
                    >
                      ODT
                    </button>
                    <button
                      onClick={() => handleExport("docx")}
                      className="hover:text-primary underline"
                    >
                      Word
                    </button>
                    <button
                      onClick={() => handleExport("pdf")}
                      className="hover:text-primary underline"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => handleExport("html")}
                      className="hover:text-primary underline"
                    >
                      HTML
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t("import")}:</span>
                    <label className="hover:text-primary underline cursor-pointer">
                      {t("chooseFile")}
                      <input
                        type="file"
                        className="hidden"
                        accept=".odt,.docx,.txt,.html"
                        onChange={handleImport}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showHistory && (
          <div className="w-80 border-l border-border bg-card flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
              <h3 className="font-bold flex items-center gap-2">
                <History className="w-4 h-4" /> {t("history")}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {history.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border transition-all group relative cursor-pointer"
                  onClick={() => restoreVersion(v)}
                >
                  <div className="text-sm font-medium">{v.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {new Date(v.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
            content: "${t("writeHere")}";
        }
      `}</style>
    </AppShell>
  );
}
