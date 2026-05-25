"use client";

import { MessageCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import PageHeader from "@/components/layout/PageHeader";

async function matrixLogin({ homeserver, identifier, password }) {
  const localpart = identifier.replace(/^@/, "").split(":")[0];
  const response = await fetch(`${homeserver.replace(/\/$/, "")}/_matrix/client/v3/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "m.login.password", identifier: { type: "m.id.user", user: localpart }, password }),
  });
  if (!response.ok) throw new Error("login_failed");
  return response.json();
}

export default function ChatClient({ matrixHandle }) {
  const t = useTranslations("Chat");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [auth, setAuth] = useState({ homeserver: "https://matrix.org", identifier: "", password: "", token: "", userId: "", error: "", pending: false });
  const [message, setMessage] = useState("");
  const isLinked = Boolean(matrixHandle);

  useEffect(() => {
    if (!isLinked) return;
    fetch("/api/matrix/linked-users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []));
  }, [isLinked]);

  const parsedHandle = useMemo(() => {
    const [matrixUserId, homeserver] = (matrixHandle || "").split("|");
    return { matrixUserId, homeserver };
  }, [matrixHandle]);

  const handleLogin = async () => {
    setAuth((prev) => ({ ...prev, pending: true, error: "" }));
    try {
      const data = await matrixLogin(auth);
      setAuth((prev) => ({ ...prev, token: data.access_token, userId: data.user_id, pending: false, password: "" }));
    } catch {
      setAuth((prev) => ({ ...prev, pending: false, error: t("authError") }));
    }
  };

  const sendMessage = async () => {
    if (!selected || !auth.token || !message.trim()) return;
    const hs = auth.homeserver.replace(/\/$/, "");
    const createRoomRes = await fetch(`${hs}/_matrix/client/v3/createRoom`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ is_direct: true, invite: [selected.matrixUserId], preset: "trusted_private_chat" }),
    });
    const roomData = await createRoomRes.json();
    const roomId = roomData.room_id;
    if (!roomId) return;

    await fetch(`${hs}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/send/m.room.message/${crypto.randomUUID()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ msgtype: "m.text", body: message.trim() }),
    });
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader subtitle={t("subtitle")} title={t("title")} icon={MessageCircle} />
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-6">
          {!isLinked && <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">{t("linkRequired")}</div>}

          {isLinked && (
            <>
              <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
                <p className="text-sm text-muted-foreground">{t("linkedAs", { matrixUserId: parsedHandle.matrixUserId })}</p>
                {!auth.token ? (
                  <div className="grid gap-3 md:grid-cols-4">
                    <input value={auth.identifier} onChange={(e) => setAuth((p) => ({ ...p, identifier: e.target.value }))} placeholder={t("identifierPlaceholder")} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                    <input value={auth.homeserver} onChange={(e) => setAuth((p) => ({ ...p, homeserver: e.target.value }))} placeholder={t("homeserverPlaceholder")} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                    <input type="password" value={auth.password} onChange={(e) => setAuth((p) => ({ ...p, password: e.target.value }))} placeholder={t("passwordPlaceholder")} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                    <button type="button" onClick={handleLogin} disabled={auth.pending} className="rounded-lg border border-primary text-primary text-sm font-medium px-4 py-2">{t("loginButton")}</button>
                  </div>
                ) : (
                  <p className="text-sm text-green-500">{t("authSuccess")}</p>
                )}
                {auth.error && <p className="text-sm text-destructive">{auth.error}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                  <h2 className="text-sm font-semibold">{t("availableUsers")}</h2>
                  {users.map((u) => (
                    <button type="button" key={u.userId} onClick={() => setSelected(u)} className="w-full text-left rounded-lg border border-border px-3 py-2 hover:border-primary/40 flex items-center gap-3">
                      <Avatar src={u.image} displayName={u.displayName} size="sm" />
                      <div>
                        <p className="text-sm font-medium">{u.displayName}</p>
                        <p className="text-xs text-muted-foreground">{u.matrixUserId}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <h2 className="text-sm font-semibold">{selected ? selected.displayName : t("noSelection")}</h2>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("messagePlaceholder")} className="w-full min-h-28 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                  <button type="button" disabled={!auth.token || !selected || !message.trim()} onClick={sendMessage} className="w-full rounded-lg border border-primary text-primary text-sm font-medium px-4 py-2 flex items-center justify-center gap-2 disabled:opacity-60">
                    <Send size={16} /> {t("send")}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
