"use client";

import {
  ArrowLeft,
  Hash,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Paperclip,
  RefreshCw,
  Send,
  Users,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/ui/SubmitButton";
import { fetchAction } from "@/lib/asyncAction";
import { clientProcessImage } from "@/lib/images/clientImageProcessing";
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rooms, setRooms] = useState(initialRooms || []);
  const [roomsError, setRoomsError] = useState(initialRoomsError);

  const initialRoomId = searchParams.get("room");
  const initialUserId = searchParams.get("user");

  const [mode, setMode] = useState(() => {
    if (initialRoomId) return "group";
    if (initialUserId) return "direct";
    return (initialRooms || []).length > 0 ? "group" : "direct";
  });

  const [selectedId, setSelectedId] = useState(() => {
    if (initialRoomId) return initialRoomId;
    if (initialUserId) return initialUserId;
    return null;
  });

  const [showListOnMobile, setShowListOnMobile] = useState(!selectedId);
  const [unreadCounts, setUnreadCounts] = useState({ group: {}, direct: {} });
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({
    has_more: false,
    next_before: null,
  });
  const [messageText, setMessageText] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [showAttachmentDrawer, setShowAttachmentDrawer] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
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

  const scrollToBottom = useCallback((force = false) => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // 100px tolerance
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (force || isNearBottom) {
      scrollRef.current.scrollTo({
        top: scrollHeight,
        behavior: force ? "auto" : "smooth",
      });
    }
  }, []);

  const markAsRead = useCallback(async () => {
    if (!selectedId) return;
    try {
      await fetch("/api/chat/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: selectedId, chatType: mode }),
      });
      // Update local unread counts
      setUnreadCounts((prev) => {
        const next = { ...prev };
        if (mode === "group") {
          const nextGroup = { ...next.group };
          delete nextGroup[selectedId];
          next.group = nextGroup;
        } else {
          const nextDirect = { ...next.direct };
          delete nextDirect[selectedId];
          next.direct = nextDirect;
        }
        return next;
      });
    } catch (error) {
      console.error("Failed to mark chat as read", error);
    }
  }, [selectedId, mode]);

  const loadUnreadCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/unread");
      if (res.ok) {
        const data = await res.json();
        setUnreadCounts(data);
      }
    } catch (error) {
      console.error("Failed to load unread counts", error);
    }
  }, []);

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
      scrollToBottom(true);
      markAsRead();
    });
  }, [selectedQuery, t, scrollToBottom, markAsRead]);

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
      if (incoming.length > 0) {
        setMessages((current) => mergeMessages(current, incoming));
        requestAnimationFrame(() => {
          scrollToBottom();
          // If we are at the bottom, mark as read
          const { scrollTop, scrollHeight, clientHeight } =
            scrollRef.current || {};
          if (scrollHeight - scrollTop - clientHeight < 100) {
            markAsRead();
          }
        });
      }
    }
  }, [newestTimestamp, selectedQuery, t, scrollToBottom, markAsRead]);

  useEffect(() => {
    pollRef.current = pollMessages;
  }, [pollMessages]);

  useEffect(() => {
    loadUnreadCounts();
  }, [loadUnreadCounts]);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages();

    // Update URL without full navigation
    const params = new URLSearchParams();
    if (mode === "group") params.set("room", selectedId);
    else params.set("user", selectedId);
    router.replace(`/chat?${params.toString()}`, { scroll: false });
  }, [selectedId, mode, loadMessages, router]);

  // Handle mobile list visibility when selectedId changes
  useEffect(() => {
    if (selectedId) {
      setShowListOnMobile(false);
    }
  }, [selectedId]);

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
    setSelectedId(null);
    setMessages([]);
    setPagination({ has_more: false, next_before: null });
    setMessageError(null);
    requestTokenRef.current++;
    setShowListOnMobile(true);
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
    const attachment = attachmentUrl.trim();
    if ((!trimmed && !attachment) || !selectedId)
      return { ok: false, error: t("errors.emptyMessage") };

    const payload = {
      chat_type: mode,
      chat_id: selectedId,
      body: trimmed || (attachment ? t("imageAttachment") : ""),
    };
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
    if (result.ok) {
      setAttachmentUrl("");
      setShowAttachmentDrawer(false);
    }
    return result;
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setShowAttachmentDrawer(false);

    try {
      const processed = await clientProcessImage(file);
      setAttachmentUrl(processed);
    } catch (error) {
      console.error("Image processing failed:", error);
    } finally {
      setIsProcessingImage(false);
    }
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
      <aside
        className={cn(
          "min-h-0 flex-col rounded-2xl border border-border bg-card shadow-sm md:flex",
          showListOnMobile ? "flex" : "hidden",
        )}
      >
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
              {activeItems.map((item) => {
                const unreadCount =
                  mode === "group"
                    ? unreadCounts.group?.[item.id]
                    : unreadCounts.direct?.[item.id];

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all relative",
                      selectedId === item.id
                        ? "border-primary/60 bg-primary/10"
                        : "border-transparent hover:border-border hover:bg-muted/60",
                    )}
                  >
                    {unreadCount > 0 && (
                      <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
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
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <section
        className={cn(
          "min-h-0 flex-col rounded-2xl border border-border bg-card shadow-sm md:flex",
          !showListOnMobile ? "flex" : "hidden",
        )}
      >
        <div className="flex items-center gap-3 border-b border-border p-4">
          <button
            type="button"
            onClick={() => setShowListOnMobile(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition-colors hover:bg-muted/80 md:hidden"
          >
            <ArrowLeft size={20} />
          </button>
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
            <div className="flex h-full items-center justify-center text-center text-muted-foreground px-8">
              <div className="max-w-xs space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <MessageCircle size={32} />
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  {t("selectConversationPlaceholder")}
                </p>
              </div>
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
                    {message.attachment_type === "image" &&
                      message.attachment_body && (
                        <div className="mb-2 block overflow-hidden rounded-xl border border-current/20">
                          {/* biome-ignore lint/performance/noImgElement: local data URL or optimized attachment */}
                          <img
                            src={message.attachment_body}
                            alt=""
                            className="max-h-64 w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                    {message.attachment_type === "link" &&
                      message.attachment_body && (
                        <a
                          href={message.attachment_body}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mb-2 block overflow-hidden rounded-xl border border-current/20"
                        >
                          {/* biome-ignore lint/performance/noImgElement: external attachment URL */}
                          <img
                            src={message.attachment_body}
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

        <div className="relative border-t border-border p-4">
          {showAttachmentDrawer && (
            <div className="absolute bottom-full left-4 right-4 mb-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-xl">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ImageIcon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{t("attachImage")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("attachImageSubtitle")}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentUrl("https://");
                    setShowAttachmentDrawer(false);
                  }}
                  className="flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Paperclip size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{t("attachLink")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("attachLinkSubtitle")}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-end gap-3">
            <button
              type="button"
              onClick={() => setShowAttachmentDrawer(!showAttachmentDrawer)}
              disabled={!selectedItem || isProcessingImage}
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-background transition-colors disabled:opacity-50",
                showAttachmentDrawer
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={t("attachmentButton")}
            >
              {isProcessingImage ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Paperclip size={18} />
              )}
            </button>
            <div className="flex-1 space-y-2">
              {attachmentUrl !== "" && (
                <div className="group relative overflow-hidden rounded-xl border border-border bg-background">
                  {attachmentUrl.startsWith("data:") ? (
                    <div className="flex items-center gap-3 p-2">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                        {/* biome-ignore lint/performance/noImgElement: local data URL */}
                        <img
                          src={attachmentUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-foreground">
                          {t("imageAttachment")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {t("readyToSend")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachmentUrl("")}
                        className="mr-1 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Paperclip
                        size={14}
                        className="shrink-0 text-muted-foreground"
                      />
                      <input
                        type="url"
                        value={attachmentUrl}
                        onChange={(event) =>
                          setAttachmentUrl(event.target.value)
                        }
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
              icon={<Send size={18} />}
              size="icon"
              loadingLabel=""
              successLabel=""
              errorLabel=""
              onClick={sendMessage}
              onSuccess={(data) => {
                const created = data?.message;
                if (created)
                  setMessages((current) => mergeMessages(current, [created]));
                setMessageText("");
                requestAnimationFrame(() => {
                  scrollToBottom(true);
                  markAsRead();
                });
              }}
              successToast={t("messageSent")}
              errorToast={t("errors.send")}
              disabled={
                !selectedItem || (!messageText.trim() && !attachmentUrl.trim())
              }
              successDuration={0}
              className="h-12 w-12 shrink-0 rounded-2xl"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
