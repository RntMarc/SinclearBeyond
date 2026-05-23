"use client";

import {
  ChevronRight,
  FilePlus,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import { InlineError } from "@/components/ui/InlineError";

export default function OfficeClient({ user, session }) {
  const t = useTranslations("Office");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/office/documents");
      if (!res.ok) throw new Error(t("errorLoad"));
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/office/documents", {
        method: "POST",
        body: JSON.stringify({ title: t("defaultTitle") }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(t("errorCreate"));
      const newDoc = await res.json();
      window.location.href = `/office/${newDoc.id}`;
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  };

  const deleteDocument = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(t("deleteConfirm"))) return;

    try {
      const res = await fetch(`/api/office/documents/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(t("errorDelete"));
      setDocuments(documents.filter((d) => d.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full bg-background overflow-y-auto">
        <PageHeader title={t("title")} subtitle={t("subtitle")} icon={FileText} />

        <div className="p-6 max-w-5xl mx-auto w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{t("myDocuments")}</h2>
            <Button onClick={createDocument} disabled={creating}>
              {creating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FilePlus className="w-4 h-4 mr-2" />
              )}
              {t("newDocument")}
            </Button>
          </div>

          {error && <InlineError message={error} className="mb-4" />}

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-border rounded-xl">
              <p className="text-muted-foreground mb-4">{t("noDocuments")}</p>
              <Button variant="outline" onClick={createDocument}>
                {t("createFirst")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/office/${doc.id}`}
                  className="block group"
                >
                  <div className="p-4 bg-card border border-border rounded-xl hover:border-primary transition-colors h-full flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <FileText className="w-8 h-8 text-primary" />
                        <button
                          onClick={(e) => deleteDocument(e, doc.id)}
                          className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="font-medium truncate">{doc.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("lastEdited")}: {new Date(doc.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
