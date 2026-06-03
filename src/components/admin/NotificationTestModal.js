"use client";

import { Check, Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import SubmitButton from "@/components/ui/SubmitButton";
import { fetchAction } from "@/lib/asyncAction";

const TYPES = [
  { value: "forum", label: "Forum" },
  { value: "poll", label: "Umfrage" },
  { value: "event", label: "Event" },
  { value: "trip", label: "Reise" },
  { value: "changelog", label: "Changelog" },
  { value: "test", label: "Test" },
];

export default function NotificationTestModal({ onClose }) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [type, setType] = useState("test");
  const [title, setTitle] = useState("Test-Benachrichtigung");
  const [message, setMessage] = useState("");
  const [deepLink, setDeepLink] = useState("/home");
  const [sendInternal, setSendInternal] = useState(true);
  const [sendPush, setSendPush] = useState(true);
  const [allUsers, setAllUsers] = useState(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  const fetchSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch {
      console.error("Search failed");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim()) {
        fetchSearch(search);
      } else {
        setSearchResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [search, fetchSearch]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        searchRef.current &&
        !searchRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addUser = (user) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers((prev) => [...prev, user]);
    }
    setSearch("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const removeUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const selectAllUsers = async () => {
    if (allUsers) {
      setSelectedUsers(allUsers);
      return;
    }
    setLoadingAll(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
        setSelectedUsers(data);
      }
    } catch {
      console.error("Failed to fetch all users");
    } finally {
      setLoadingAll(false);
    }
  };

  const isSelected = (userId) => selectedUsers.some((u) => u.id === userId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return { ok: false, error: "Keine User" };

    const result = await fetchAction(
      "/api/admin/test-notification",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedUsers.map((u) => u.id),
          type,
          title,
          body: message,
          url: deepLink,
          sendInternal,
          sendPush,
        }),
      },
      { fallbackError: "Senden fehlgeschlagen" },
    );
    if (result.ok) onClose();
    return result;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-sidebar border border-sidebar-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sidebar-border shrink-0">
          <h2 className="text-lg font-medium">Test-Benachrichtigung senden</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted-foreground hover:bg-sidebar-accent rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground ml-1">
              Empfänger
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="User suchen…"
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
            </div>

            {showDropdown && searchResults.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-10 w-[calc(100%-3rem)] max-h-48 overflow-y-auto bg-background border border-border rounded-xl shadow-xl mt-1"
              >
                {searchResults.map((user) => (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => addUser(user)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-sidebar-accent transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0 overflow-hidden">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.displayName?.charAt(0) || "?"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    {isSelected(user.id) && (
                      <Check size={16} className="text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap min-h-[2rem]">
              {selectedUsers.map((user) => (
                <span
                  key={user.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
                >
                  {user.displayName}
                  <button
                    type="button"
                    onClick={() => removeUser(user.id)}
                    className="hover:text-primary/70 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={selectAllUsers}
              disabled={loadingAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              {loadingAll ? (
                <Loader2 size={12} className="animate-spin" />
              ) : null}
              {selectedUsers.length === (allUsers?.length || 0)
                ? `${selectedUsers.length} User ausgewählt`
                : "Alle User auswählen"}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground ml-1">
              Typ
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground ml-1">
              Titel
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground ml-1">
              Nachricht (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground ml-1">
              Deep Link
            </label>
            <input
              type="text"
              value={deepLink}
              onChange={(e) => setDeepLink(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground ml-1">
              Senden via
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-xl cursor-pointer hover:bg-sidebar-accent/30 transition-colors">
                <input
                  type="checkbox"
                  checked={sendInternal}
                  onChange={(e) => setSendInternal(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span className="text-sm">
                  System-Benachrichtigung (In-App)
                </span>
              </label>
              <label className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-xl cursor-pointer hover:bg-sidebar-accent/30 transition-colors">
                <input
                  type="checkbox"
                  checked={sendPush}
                  onChange={(e) => setSendPush(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span className="text-sm">Push-Benachrichtigung (PWA)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium hover:bg-sidebar-accent rounded-xl transition-colors"
            >
              Abbrechen
            </button>
            <SubmitButton
              type="submit"
              onClick={handleSubmit}
              label="Senden"
              savingLabel="Wird gesendet…"
              successDuration={0}
              showInlineError={false}
              disabled={selectedUsers.length === 0}
              className="px-6 py-2.5 min-w-[120px]"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
