"use client";
import {
  Calendar,
  CheckSquare,
  Plus,
  Star,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import SaveButton from "@/components/SaveButton";

export default function PollForm({ initialData, saving, onSubmit, onCancel }) {
  const t = useTranslations("Polls");
  const tc = useTranslations("Common");

  const [form, setForm] = useState(
    initialData || {
      type: "appointment",
      title: "",
      description: "",
      questions: [
        {
          title: "",
          type: "date",
          options: [{ dateValue: "" }],
        },
      ],
      invites: [],
    },
  );
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          title: "",
          type: "text",
          options: [],
        },
      ],
    }));
  };

  const removeQuestion = (qIdx) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== qIdx),
    }));
  };

  const handleQuestionChange = (qIdx, field, value) => {
    setForm((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[qIdx] = { ...newQuestions[qIdx], [field]: value };

      // If switching to choice/date types, ensure they have at least one option
      if (field === "type") {
        if (["single_choice", "multiple_choice"].includes(value)) {
          if (
            !newQuestions[qIdx].options ||
            newQuestions[qIdx].options.length === 0
          ) {
            newQuestions[qIdx].options = [{ label: "" }];
          }
        } else if (value === "date") {
          if (
            !newQuestions[qIdx].options ||
            newQuestions[qIdx].options.length === 0
          ) {
            newQuestions[qIdx].options = [{ dateValue: "" }];
          }
        } else {
          newQuestions[qIdx].options = [];
        }
      }

      return { ...prev, questions: newQuestions };
    });
  };

  const addOption = (qIdx) => {
    setForm((prev) => {
      const newQuestions = [...prev.questions];
      const isDate = newQuestions[qIdx].type === "date";
      newQuestions[qIdx].options = [
        ...newQuestions[qIdx].options,
        isDate ? { dateValue: "" } : { label: "" },
      ];
      return { ...prev, questions: newQuestions };
    });
  };

  const removeOption = (qIdx, optIdx) => {
    setForm((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[qIdx].options = newQuestions[qIdx].options.filter(
        (_, i) => i !== optIdx,
      );
      return { ...prev, questions: newQuestions };
    });
  };

  const handleOptionChange = (qIdx, optIdx, field, value) => {
    setForm((prev) => {
      const newQuestions = [...prev.questions];
      const newOptions = [...newQuestions[qIdx].options];
      newOptions[optIdx] = { ...newOptions[optIdx], [field]: value };
      newQuestions[qIdx].options = newOptions;
      return { ...prev, questions: newQuestions };
    });
  };

  const toggleInvite = (user) => {
    setForm((prev) => {
      const isInvited = prev.invites.some((i) => i.userId === user.id);
      if (isInvited) {
        return {
          ...prev,
          invites: prev.invites.filter((i) => i.userId !== user.id),
        };
      }
      return {
        ...prev,
        invites: [...prev.invites, { userId: user.id, isIndispensable: false }],
      };
    });
  };

  const toggleIndispensable = (userId) => {
    setForm((prev) => ({
      ...prev,
      invites: prev.invites.map((i) =>
        i.userId === userId ? { ...i, isIndispensable: !i.isIndispensable } : i,
      ),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) &&
      !form.invites.some((i) => i.userId === u.id),
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {/* Type Selection */}
        {!initialData && (
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setForm((prev) => ({
                  ...prev,
                  type: "appointment",
                  questions: [
                    { title: "", type: "date", options: [{ dateValue: "" }] },
                  ],
                }));
              }}
              className={`flex flex-col items-center gap-3 p-4 rounded-lg-custom border-2 transition-all ${
                form.type === "appointment"
                  ? "border-primary bg-primary/5"
                  : "border-sidebar-border bg-sidebar-accent/30 opacity-60 hover:opacity-100"
              }`}
            >
              <Calendar
                size={24}
                className={
                  form.type === "appointment"
                    ? "text-primary"
                    : "text-muted-foreground"
                }
              />
              <div className="text-center">
                <p className="text-sm font-bold">{t("types.appointment")}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setForm((prev) => ({
                  ...prev,
                  type: "survey",
                  questions: [{ title: "", type: "text", options: [] }],
                }));
              }}
              className={`flex flex-col items-center gap-3 p-4 rounded-lg-custom border-2 transition-all ${
                form.type === "survey"
                  ? "border-primary bg-primary/5"
                  : "border-sidebar-border bg-sidebar-accent/30 opacity-60 hover:opacity-100"
              }`}
            >
              <CheckSquare
                size={24}
                className={
                  form.type === "survey"
                    ? "text-primary"
                    : "text-muted-foreground"
                }
              />
              <div className="text-center">
                <p className="text-sm font-bold">{t("types.survey")}</p>
              </div>
            </button>
          </div>
        )}

        {/* Title & Description */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1">
              {t("pollTitle")}
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              required
              placeholder={t("pollTitlePlaceholder")}
              className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1">
              {t("description")}
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder={t("descriptionPlaceholder")}
              rows={2}
              className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between ml-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              {t("questions")}
            </p>
            {form.type === "survey" && (
              <button
                type="button"
                onClick={addQuestion}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                + {t("addQuestion")}
              </button>
            )}
          </div>

          <div className="space-y-8">
            {form.questions.map((q, qIdx) => (
              <div
                key={q.id || qIdx}
                className="relative bg-sidebar-accent/30 border border-sidebar-border rounded-lg-custom p-5 space-y-4"
              >
                {form.type === "survey" && form.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIdx)}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold ml-1">
                        {t("questionTitle")}
                      </label>
                      <input
                        type="text"
                        value={q.title}
                        onChange={(e) =>
                          handleQuestionChange(qIdx, "title", e.target.value)
                        }
                        required
                        placeholder={
                          form.type === "appointment"
                            ? t("pollTitlePlaceholder")
                            : t("questionPlaceholder")
                        }
                        className="w-full bg-background border border-sidebar-border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                      />
                    </div>
                    {form.type === "survey" && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold ml-1">
                          {t("questionType")}
                        </label>
                        <select
                          value={q.type}
                          onChange={(e) =>
                            handleQuestionChange(qIdx, "type", e.target.value)
                          }
                          className="w-full bg-background border border-sidebar-border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                        >
                          {Object.keys(t.raw("questionTypes"))
                            .filter((k) => k !== "date")
                            .map((key) => (
                              <option key={key} value={key}>
                                {t(`questionTypes.${key}`)}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Options for this question */}
                  {["single_choice", "multiple_choice", "date"].includes(
                    q.type,
                  ) && (
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold ml-1">
                        {t("options")}
                      </label>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={opt.id || optIdx}
                            className="flex items-center gap-2"
                          >
                            {q.type === "date" ? (
                              <input
                                type="datetime-local"
                                value={
                                  opt.dateValue
                                    ? new Date(
                                        new Date(opt.dateValue).getTime() -
                                          new Date(
                                            opt.dateValue,
                                          ).getTimezoneOffset() *
                                            60000,
                                      )
                                        .toISOString()
                                        .slice(0, 16)
                                    : ""
                                }
                                onChange={(e) =>
                                  handleOptionChange(
                                    qIdx,
                                    optIdx,
                                    "dateValue",
                                    e.target.value,
                                  )
                                }
                                required
                                className="flex-1 bg-background border border-sidebar-border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                              />
                            ) : (
                              <input
                                type="text"
                                value={opt.label}
                                onChange={(e) =>
                                  handleOptionChange(
                                    qIdx,
                                    optIdx,
                                    "label",
                                    e.target.value,
                                  )
                                }
                                required
                                placeholder={`Option ${optIdx + 1}`}
                                className="flex-1 bg-background border border-sidebar-border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                              />
                            )}
                            {q.options.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeOption(qIdx, optIdx)}
                                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(qIdx)}
                          className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-sidebar-border rounded-xl text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
                        >
                          <Plus size={14} />
                          {t("addOption")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invites */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold ml-1">
            {t("invites")}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {form.invites.map((invite) => {
              const user = users.find((u) => u.id === invite.userId);
              if (!user) return null;
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-2 bg-sidebar-accent/50 border border-sidebar-border rounded-full pl-1 pr-3 py-1"
                >
                  <Avatar
                    src={user.image}
                    displayName={user.displayName}
                    size="xs"
                  />
                  <span className="text-xs font-medium">
                    {user.displayName}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleIndispensable(user.id)}
                    className={`p-1 rounded-full transition-colors ${invite.isIndispensable ? "text-yellow-500 bg-yellow-500/10" : "text-muted-foreground hover:text-yellow-500"}`}
                    title={t("indispensable")}
                  >
                    <Star
                      size={12}
                      fill={invite.isIndispensable ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleInvite(user)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground">
              <UserPlus size={16} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("inviteUsers")}
              className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {search && (
            <div className="bg-sidebar-accent/50 border border-sidebar-border rounded-xl overflow-hidden divide-y divide-sidebar-border max-h-48 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      toggleInvite(user);
                      setSearch("");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-sidebar-accent transition-colors text-left"
                  >
                    <Avatar
                      src={user.image}
                      displayName={user.displayName}
                      size="xs"
                    />
                    <span className="text-sm">{user.displayName}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                  {tc("noEntries")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {tc("cancel")}
        </button>
        <SaveButton loading={saving} type="submit">
          {t("form.save")}
        </SaveButton>
      </div>
    </form>
  );
}
