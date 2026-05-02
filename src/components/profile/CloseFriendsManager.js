"use client";

import { Search, User, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { addCloseFriend, removeCloseFriend } from "@/lib/profile/closeFriends";

export default function CloseFriendsManager({ initialFriends }) {
  const [friends, setFriends] = useState(initialFriends);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/users?search=${encodeURIComponent(search)}`,
        );
        if (res.ok) {
          const allUsers = await res.json();
          // Filter out current user and existing friends
          const filtered = allUsers.filter(
            (u) => !friends.some((f) => f.id === u.id),
          );
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, friends]);

  const handleAdd = async (user) => {
    const res = await addCloseFriend(user.id);
    if (res.ok) {
      setFriends([...friends, user]);
      setSearch("");
    }
  };

  const handleRemove = async (friendId) => {
    const res = await removeCloseFriend(friendId);
    if (res.ok) {
      setFriends(friends.filter((f) => f.id !== friendId));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium mb-3 text-foreground">
          Enge Kontakte hinzufügen
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name suchen..."
            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="mt-2 bg-sidebar border border-sidebar-border rounded-xl overflow-hidden divide-y divide-sidebar-border">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-sidebar-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {user.image
                      ? <img
                          src={user.image}
                          alt={user.displayName}
                          className="w-full h-full object-cover"
                        />
                      : <User size={16} className="text-muted-foreground" />}
                  </div>
                  <span className="text-sm font-medium">
                    {user.displayName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdd(user)}
                  className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <UserPlus size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
        {loading && (
          <p className="text-xs text-muted-foreground mt-2 px-2">Suche...</p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">
          Deine engen Kontakte
        </h3>
        {friends.length > 0
          ? <div className="grid grid-cols-1 gap-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 bg-sidebar border border-sidebar-border rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {friend.image
                        ? <img
                            src={friend.image}
                            alt={friend.displayName}
                            className="w-full h-full object-cover"
                          />
                        : <User size={20} className="text-muted-foreground" />}
                    </div>
                    <span className="text-sm font-medium">
                      {friend.displayName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(friend.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          : <p className="text-sm text-muted-foreground italic">
              Noch keine engen Kontakte festgelegt.
            </p>}
      </div>
    </div>
  );
}
