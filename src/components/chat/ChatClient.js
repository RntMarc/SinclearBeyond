"use client";

import {
  Hash,
  Loader2,
  MessageCircle,
  Paperclip,
  RefreshCw,
  Send,
  Users,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/ui/SubmitButton";
import { fetchAction } from "@/lib/asyncAction";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_ACTIVE_MS = 5_000;
const POLL_INTERVAL_HIDDEN_MS = 60_000;

function sortMessages(messages) {
  return [...messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

function mergeMessages(current, incoming) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return sortMessages(Array.from(byId.values()));
}

export default function ChatClient({
  contacts,
  contactsError,
  initialRooms,
  initialRoomsError,
  currentUser,
}) {
  const t = useTranslations("Chat");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const [rooms, setRooms] = useState(initialRooms || []);
  const [roomsError, setRoomsError] = useState(initialRoomsError);
  const [mode, setMode] = useState(
    (initialRooms || []).length > 0 ? "group" : "direct",
  );
  const [selectedId, setSelectedId] = useState(
    (initialRooms || [])[0]?.id || contacts?.[0]?.id || null,
  );
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({
    has_more: false,
    next_before: null,
  });
  const [messageText, setMessageText] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [messageError, setMessageError] = useState(null);
  const scrollRef = useRef(null);
  const requestTokenRef = useRef(0);
  const pollRef = useRef(null);

  const activeItems = mode === "group" ? rooms : contacts;
  const selectedItem =
    activeItems.find((item) => item.id === selectedId) || null;

  const newestTimestamp = useMemo(
    () => messages.at(-1)?.created_at || null,
    [messages],
  );

  const selectedQuery = useCallback(
    ({ after, before, limit = 50 } = {}) => {
      if (!selectedId) return null;
      const params = new URLSearchParams({
        chat_type: mode,
        limit: String(limit),
      });
      if (mode === "group") params.set("chat_id", selectedId);
      else params.set("chat_partner_id", selectedId);
      if (after) params.set("after", after);
      if (before) params.set("before", before);
      return { path: "/api/chat/messages", query: params };
    },
    [mode, selectedId],
  );

  const loadRooms = useCallback(async () => {
    const result = await fetchAction("/api/chat/rooms", undefined, {
      fallbackError: t("errors.rooms"),
    });
    if (!result.ok) {
      setRoomsError(result.error || t("errors.rooms"));
      return;
    }
    const nextRooms = result.data?.data || [];
    setRooms(nextRooms);
    setRoomsError(null);
    if (mode === "group" && !selectedId && nextRooms[0])
      setSelectedId(nextRooms[0].id);
  }, [mode, selectedId, t]);

  const loadMessages = useCallback(async () => {
    const q = selectedQuery();
    if (!q) return;
    const myToken = ++requestTokenRef.current;
    setLoadingMessages(true);
    setMessageError(null);
    const result = await fetchAction(
      `${q.path}?${q.query.toString()}`,
      undefined,
      { fallbackError: t("errors.messages") },
    );
    if (myToken !== requestTokenRef.current) return;
    setLoadingMessages(false);
    if (!result.ok) {
      setMessageError(result.error || t("errors.messages"));
      return;
    }
    setMessages(sortMessages(result.data?.data || []));
    setPagination(
      result.data?.pagination || { has_more: false, next_before: null },
    );
    requestAnimationFrame(() => {
      if (scrollRef.current)
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, [selectedQuery, t]);

  const pollMessages = useCallback(async () => {
    if (!newestTimestamp) return;
    const q = selectedQuery({ after: newestTimestamp, limit: 100 });
    if (!q) return;
    const result = await fetchAction(
      `${q.path}?${q.query.toString()}`,
      undefined,
      { fallbackError: t("errors.messages") },
    );
    if (result.ok) {
      const incoming = result.data?.data || [];
      if (incoming.length > 0)
        setMessages((current) => mergeMessages(current, incoming));
    }
  }, [newestTimestamp, selectedQuery, t]);

  useEffect(() => {
    pollRef.current = pollMessages;
  }, [pollMessages]);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages();
  }, [selectedId, loadMessages]);

  useEffect(() => {
    if (!selectedId) return undefined;
    if (typeof document === "undefined") return undefined;

    let timer = null;
    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;
      const hidden = document.visibilityState === "hidden";
      const delay = hidden ? POLL_INTERVAL_HIDDEN_MS : POLL_INTERVAL_ACTIVE_MS;
      timer = setTimeout(async () => {
        if (cancelled) return;
        await pollRef.current?.();
        schedule();
      }, delay);
    };
    schedule();

    const onVisibility = () => {
      if (timer) clearTimeout(timer);
      schedule();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [selectedId]);

  const selectMode = (nextMode) => {
    setMode(nextMode);
    const nextItems = nextMode === "group" ? rooms : contacts;
    setSelectedId(nextItems[0]?.id || null);
    setMessages([]);
    setPagination({ has_more: false, next_before: null });
    setMessageError(null);
    requestTokenRef.current++;
  };

  const loadOlderMessages = async () => {
    if (!pagination?.has_more || !pagination?.next_before) return;
    const q = selectedQuery({ before: pagination.next_before });
    if (!q) return;
    setLoadingOlder(true);
    const result = await fetchAction(
      `${q.path}?${q.query.toString()}`,
      undefined,
      { fallbackError: t("errors.messages") },
    );
    setLoadingOlder(false);
    if (!result.ok) {
      setMessageError(result.error || t("errors.messages"));
      return;
    }
    setMessages((current) => mergeMessages(result.data?.data || [], current));
    setPagination(
      result.data?.pagination || { has_more: false, next_before: null },
    );
  };

  const sendMessage = async () => {
    const trimmed = messageText.trim();
    if (!trimmed || !selectedId)
      return { ok: false, error: t("errors.emptyMessage") };
    const payload = {
      chat_type: mode,
      chat_id: selectedId,
      body: trimmed,
    };
    const attachment = attachmentUrl.trim();
    if (attachment) payload.attachment_url = attachment;
    const result = await fetchAction(
      "/api/chat/messages",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      { fallbackError: t("errors.send") },
    );
    if (result.ok) setAttachmentUrl("");
    return result;
  };

  const formatTime = (value) =>
    new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

  const resolveAuthor = (userId) => {
    if (userId === currentUser?.id) return currentUser;
    return (
      contacts.find((contact) => contact.id === userId) || {
        displayName: userId,
      }
    );
  };

  return (
    <div className="grid flex-1 gap-4 overflow-hidden p-4 md:grid-cols-[320px_minmax(0,1fr)] md:p-6 lg:p-10">
      <aside className="flex min-h-0 flex-col rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-muted p-1">
            <button
              type="button"
              onClick={() => selectMode("group")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                mode === "group"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Hash size={16} />
              {t("rooms")}
            </button>
            <button
              type="button"
              onClick={() => selectMode("direct")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                mode === "direct"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Users size={16} />
              {t("directMessages")}
            </button>
          </div>
        </div>

        {mode === "group" && roomsError && (
          <div className="m-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <p>{roomsError}</p>
            <button
              type="button"
              onClick={loadRooms}
              className="mt-2 inline-flex items-center gap-1 font-semibold hover:underline"
            >
              <RefreshCw size={14} />
              {t("retryRooms")}
            </button>
          </div>
        )}

        {mode === "direct" && contactsError && (
          <div className="m-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {tCommon("dbError")}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {activeItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {mode === "group" ? t("emptyRooms") : t("emptyContacts")}
            </div>
          ) : (
            <div className="space-y-2">
              {activeItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                    selectedId === item.id
                      ? "border-primary/60 bg-primary/10"
                      : "border-transparent hover:border-border hover:bg-muted/60",
                  )}
                >
                  {mode === "group" ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Hash size={18} />
                    </div>
                  ) : (
                    <Avatar src={item.image} displayName={item.displayName} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {item.name || item.displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {mode === "group"
                        ? item.description ||
                          t("ttl", { days: item.ttl_days ?? 30 })
                        : item.email || tCommon("emailHidden")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <section className="flex min-h-0 flex-col rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {mode === "group" ? (
              <Hash size={20} />
            ) : (
              <MessageCircle size={20} />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black tracking-tight">
              {selectedItem
                ? selectedItem.name || selectedItem.displayName
                : t("noSelection")}
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {selectedItem
                ? mode === "group"
                  ? selectedItem.description || t("groupSubtitle")
                  : t("directSubtitle")
                : t("selectConversation")}
            </p>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-background/60 p-4"
        >
          {selectedItem && pagination?.has_more && (
            <div className="text-center">
              <button
                type="button"
                onClick={loadOlderMessages}
                disabled={loadingOlder}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {loadingOlder && <Loader2 size={14} className="animate-spin" />}
                {t("loadOlder")}
              </button>
            </div>
          )}

          {loadingMessages ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 animate-spin" size={18} />
              {tCommon("loading")}
            </div>
          ) : messageError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {messageError}
            </div>
          ) : !selectedItem ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              {t("selectConversation")}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              {t("emptyMessages")}
            </div>
          ) : (
            messages.map((message) => {
              const mine = message.user_id === currentUser?.id;
              const author = resolveAuthor(message.user_id);
              return (
                <div
                  key={message.id}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card",
                    )}
                  >
                    {!mine && mode === "group" && (
                      <p className="mb-1 text-xs font-bold text-primary">
                        {author.displayName}
                      </p>
                    )}
                    {message.attachment_url && (
                      <a
                        href={message.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-2 block overflow-hidden rounded-xl border border-current/20"
                      >
                        {/* biome-ignore lint/performance/noImgElement: user-supplied external attachment URL, next/image would require remote-pattern config */}
                        <img
                          src={message.attachment_url}
                          alt=""
                          className="max-h-64 w-full object-cover"
                          loading="lazy"
                        />
                      </a>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {message.body}
                    </p>
                    <p
                      className={cn(
                        "mt-2 text-[10px]",
                        mine
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border p-4">
          <div className="flex items-end gap-3">
            <button
              type="button"
              onClick={() =>
                setAttachmentUrl((current) => (current ? "" : "https://"))
              }
              disabled={!selectedItem}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              aria-label={t("attachmentButton")}
            >
              <Paperclip size={18} />
            </button>
            <div className="flex-1 space-y-2">
              {attachmentUrl !== "" && (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                  <Paperclip
                    size={14}
                    className="shrink-0 text-muted-foreground"
                  />
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(event) => setAttachmentUrl(event.target.value)}
                    placeholder={t("attachmentPlaceholder")}
                    className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachmentUrl("")}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={t("attachmentRemove")}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <textarea
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                rows={2}
                disabled={!selectedItem}
                placeholder={t("messagePlaceholder")}
                className="min-h-12 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:opacity-50"
              />
            </div>
            <SubmitButton
              icon={<Send size={16} />}
              label={t("send")}
              loadingLabel={tCommon("sending")}
              successLabel={tCommon("sent")}
              errorLabel={tCommon("error")}
              onClick={sendMessage}
              onSuccess={(data) => {
                const created = data?.message;
                if (created)
                  setMessages((current) => mergeMessages(current, [created]));
                setMessageText("");
                requestAnimationFrame(() => {
                  if (scrollRef.current)
                    scrollRef.current.scrollTop =
                      scrollRef.current.scrollHeight;
                });
              }}
              successToast={t("messageSent")}
              errorToast={t("errors.send")}
              disabled={!selectedItem || !messageText.trim()}
              successDuration={800}
              className="h-12 px-5"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
