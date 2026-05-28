"use client";
import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Avatar from "@/components/Avatar";

export default function PermissionEditor({
  allUsers,
  creatorId,
  isPublic,
  permissions,
  onChange,
}) {
  const t = useTranslations("Calendar.form");
  const [selectedUserId, setSelectedUserId] = useState("");

  const available = allUsers.filter(
    (u) => u.id !== creatorId && !permissions.find((p) => p.userId === u.id),
  );

  function addUser() {
    const user = allUsers.find((u) => u.id === selectedUserId);
    if (!user) return;
    onChange([
      ...permissions,
      {
        userId: user.id,
        displayName: user.displayName,
        image: user.image,
        canView: true,
        canEdit: false,
      },
    ]);
    setSelectedUserId("");
  }

  function remove(userId) {
    onChange(permissions.filter((p) => p.userId !== userId));
  }

  function toggle(userId, field) {
    onChange(
      permissions.map((p) =>
        p.userId === userId ? { ...p, [field]: !p[field] } : p,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        {t("permissions")}
      </span>
      <div className="flex gap-2">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">{t("addUser")}</option>
          {available.map((u) => (
            <option key={u.id} value={u.id}>
              {u.displayName} ({u.email})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addUser}
          disabled={!selectedUserId}
          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          <Plus size={15} />
        </button>
      </div>
      {permissions.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  {t("user")}
                </th>
                {!isPublic && (
                  <th className="font-medium text-muted-foreground px-2 py-2 text-center whitespace-nowrap">
                    {t("view")}
                  </th>
                )}
                <th className="font-medium text-muted-foreground px-2 py-2 text-center whitespace-nowrap">
                  {t("edit")}
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {permissions.map((p) => (
                <tr key={p.userId}>
                  <td className="px-3 py-2 text-foreground flex items-center gap-2 truncate max-w-[160px]">
                    <Avatar
                      src={p.image}
                      displayName={p.displayName}
                      size="xs"
                    />
                    <span className="truncate">{p.displayName}</span>
                  </td>
                  {!isPublic && (
                    <td className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(p.canView)}
                        onChange={() => toggle(p.userId, "canView")}
                        className="accent-primary"
                      />
                    </td>
                  )}
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={Boolean(p.canEdit)}
                      onChange={() => toggle(p.userId, "canEdit")}
                      className="accent-primary"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => remove(p.userId)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
