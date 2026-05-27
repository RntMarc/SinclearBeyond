"use client";

import { MessageCircle, Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import PageHeader from "@/components/layout/PageHeader";

export default function ChatClient({ matrixHandle }) {
  const t = useTranslations("Chat");
  const searchParams = useSearchParams();
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [homeserver, setHomeserver] = useState("matrix.org");
  const [matrixUser, setMatrixUser] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState("password");
  const [authError, setAuthError] = useState("");
  const [pendingSend, setPendingSend] = useState(false);
  const isLinked = Boolean(matrixHandle);

  const parsedHandle = useMemo(() => {
    if (!matrixHandle) return { matrixUserId: "", linkedHomeserver: "" };
    const parts = matrixHandle.split(":");
    const userPart = parts[0].replace(/^@/, "");
    const hsPart = parts.slice(1).join(":");
    return {
      matrixUserId: matrixHandle,
      linkedHomeserver: hsPart,
      matrixUser: userPart,
    };
  }, [matrixHandle]);

  useEffect(() => {
    if (parsedHandle.linkedHomeserver)
      setHomeserver(parsedHandle.linkedHomeserver);
    if (parsedHandle.matrixUser) setMatrixUser(parsedHandle.matrixUser);
  }, [parsedHandle.linkedHomeserver, parsedHandle.matrixUser]);

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
    const res = await fetch(
      `/api/matrix/messages?roomId=${encodeURIComponent(id)}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages || []);
  };

  useEffect(() => {
    if (!isLinked) return;
    if (searchParams.get("matrix_oauth") === "error")
      setAuthError(t("oauthError"));
    loadSession();
    loadUsers();
  }, [isLinked, searchParams, t]);

  useEffect(() => {
    if (!roomId) return;
    loadMessages(roomId);
    const interval = setInterval(() => loadMessages(roomId), 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  const startSession = async () => {
    // If linked, use the linked credentials. If not (unlikely for the modal), use state.
    const hs = isLinked ? parsedHandle.linkedHomeserver : homeserver;
    const user = isLinked ? parsedHandle.matrixUser : matrixUser;

    const res = await fetch("/api/matrix/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeserver: hs,
        method,
        matrixUser: user,
        password,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.authenticated) {
      setSessionReady(true);
      setAuthError("");
    } else if (data.redirectTo) {
      window.location.href = data.redirectTo;
    } else {
      setAuthError(t("oauthError"));
    }
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
      <PageHeader
        subtitle={t("subtitle")}
        title={t("title")}
        icon={MessageCircle}
      />
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-6">
          {!isLinked && (
            <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              {t("linkRequired")}
            </div>
          )}

          {isLinked && !sessionReady && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
              <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl space-y-6 relative">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{t("title")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("sessionRequired")}
                  </p>
                </div>

                <div className="space-y-4">
                  {method === "password" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          {t("passwordPlaceholder")}
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") startSession();
                          }}
                          placeholder={t("passwordPlaceholder")}
                          autoFocus
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={startSession}
                    className="w-full rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 hover:opacity-90 transition-opacity"
                  >
                    {method === "oauth"
                      ? t("loginButtonOAuth")
                      : t("loginButton")}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setMethod(method === "password" ? "oauth" : "password")
                      }
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                    >
                      {method === "password"
                        ? t("switchOAuth")
                        : t("switchPassword")}
                    </button>
                  </div>
                </div>

                {authError && (
                  <p className="text-sm text-destructive text-center">
                    {authError}
                  </p>
                )}
              </div>
            </div>
          )}

          {isLinked && sessionReady && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                <h2 className="text-sm font-semibold">{t("availableUsers")}</h2>
                <p className="text-xs text-muted-foreground">
                  {t("linkedAs", { matrixUserId: parsedHandle.matrixUserId })}
                </p>
                {users.map((u) => (
                  <button
                    type="button"
                    key={u.userId}
                    onClick={() => openChat(u)}
                    className="w-full text-left rounded-lg border border-border px-3 py-2 hover:border-primary/40 flex items-center gap-3"
                  >
                    <Avatar
                      src={u.image}
                      displayName={u.displayName}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium">{u.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.matrixUserId}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3 flex flex-col">
                <h2 className="text-sm font-semibold">
                  {selected ? selected.displayName : t("noSelection")}
                </h2>
                <div className="flex-1 min-h-52 max-h-80 overflow-y-auto rounded-lg border border-border p-3 space-y-2 bg-background">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.sender === parsedHandle.matrixUserId ? "ml-auto bg-primary/15" : "mr-auto bg-muted"}`}
                    >
                      <p>{m.body}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("messagePlaceholder")}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={!roomId || !message.trim() || pendingSend}
                    onClick={sendMessage}
                    className="rounded-lg border border-primary text-primary text-sm font-medium px-4 py-2 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
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
