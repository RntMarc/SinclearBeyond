"use client";

import { MessageCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import PageHeader from "@/components/layout/PageHeader";

export default function ChatClient({ matrixHandle }) {
  const t = useTranslations("Chat");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [auth, setAuth] = useState({ identifier: "", homeserver: "https://matrix.org", password: "", pending: false, error: "" });
  const [pendingSend, setPendingSend] = useState(false);
  const isLinked = Boolean(matrixHandle);

  const parsedHandle = useMemo(() => {
    const [matrixUserId] = (matrixHandle || "").split("|");
    return { matrixUserId };
  }, [matrixHandle]);

  const loadSession = async () => {
    const res = await fetch("/api/matrix/session");
    const data = await res.json();
    setSessionReady(Boolean(data.authenticated));
  };

  const loadUsers = async () => {
    const res = await fetch("/api/matrix/linked-users");
    const data = await res.json();
    setUsers(data.users || []);
  };

  const loadMessages = async (id) => {
    if (!id) return;
    const res = await fetch(`/api/matrix/messages?roomId=${encodeURIComponent(id)}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages || []);
  };

  useEffect(() => {
    if (!isLinked) return;
    loadSession();
    loadUsers();
  }, [isLinked]);

  useEffect(() => {
    if (!roomId) return;
    loadMessages(roomId);
    const interval = setInterval(() => loadMessages(roomId), 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  const verifySession = async () => {
    setAuth((p) => ({ ...p, pending: true, error: "" }));
    const res = await fetch("/api/matrix/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: auth.identifier, homeserver: auth.homeserver, password: auth.password }),
    });
    if (!res.ok) {
      setAuth((p) => ({ ...p, pending: false, error: t("authError") }));
      return;
    }
    setAuth((p) => ({ ...p, pending: false, password: "", error: "" }));
    setSessionReady(true);
  };

  const openChat = async (user) => {
    setSelected(user);
    const res = await fetch("/api/matrix/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetMatrixUserId: user.matrixUserId }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setRoomId(data.roomId);
  };

  const sendMessage = async () => {
    if (!roomId || !message.trim()) return;
    setPendingSend(true);
    const res = await fetch("/api/matrix/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, message: message.trim() }),
    });
    setPendingSend(false);
    if (!res.ok) return;
    setMessage("");
    loadMessages(roomId);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader subtitle={t("subtitle")} title={t("title")} icon={MessageCircle} />
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-6">
          {!isLinked && <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">{t("linkRequired")}</div>}

          {isLinked && !sessionReady && (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <p className="text-sm text-muted-foreground">{t("sessionRequired")}</p>
              <div className="grid gap-3 md:grid-cols-4">
                <input value={auth.identifier} onChange={(e) => setAuth((p) => ({ ...p, identifier: e.target.value }))} placeholder={t("identifierPlaceholder")} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input value={auth.homeserver} onChange={(e) => setAuth((p) => ({ ...p, homeserver: e.target.value }))} placeholder={t("homeserverPlaceholder")} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input type="password" value={auth.password} onChange={(e) => setAuth((p) => ({ ...p, password: e.target.value }))} placeholder={t("passwordPlaceholder")} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <button type="button" onClick={verifySession} disabled={auth.pending} className="rounded-lg border border-primary text-primary text-sm font-medium px-4 py-2">{t("loginButton")}</button>
              </div>
              {auth.error && <p className="text-sm text-destructive">{auth.error}</p>}
            </div>
          )}

          {isLinked && sessionReady && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                <h2 className="text-sm font-semibold">{t("availableUsers")}</h2>
                <p className="text-xs text-muted-foreground">{t("linkedAs", { matrixUserId: parsedHandle.matrixUserId })}</p>
                {users.map((u) => (
                  <button type="button" key={u.userId} onClick={() => openChat(u)} className="w-full text-left rounded-lg border border-border px-3 py-2 hover:border-primary/40 flex items-center gap-3">
                    <Avatar src={u.image} displayName={u.displayName} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{u.displayName}</p>
                      <p className="text-xs text-muted-foreground">{u.matrixUserId}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3 flex flex-col">
                <h2 className="text-sm font-semibold">{selected ? selected.displayName : t("noSelection")}</h2>
                <div className="flex-1 min-h-52 max-h-80 overflow-y-auto rounded-lg border border-border p-3 space-y-2 bg-background">
                  {messages.map((m) => (
                    <div key={m.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.sender === parsedHandle.matrixUserId ? "ml-auto bg-primary/15" : "mr-auto bg-muted"}`}>
                      <p>{m.body}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("messagePlaceholder")} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                  <button type="button" disabled={!roomId || !message.trim() || pendingSend} onClick={sendMessage} className="rounded-lg border border-primary text-primary text-sm font-medium px-4 py-2 flex items-center justify-center gap-2 disabled:opacity-60">
                    <Send size={16} /> {t("send")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
