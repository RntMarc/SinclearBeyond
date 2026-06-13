import { phpFetch } from "@/lib/api/phpClient";

export async function getPolls(userId, includeArchived = false) {
  const params = new URLSearchParams();
  if (includeArchived) params.set("archived", "1");

  const result = await phpFetch(`/polls/list?${params.toString()}`);
  if (!result.ok) return [];

  return result.data?.data || [];
}

export function validatePollData(questions) {
  const now = new Date();
  for (const q of questions) {
    if (["single_choice", "multiple_choice", "date"].includes(q.type)) {
      const values = q.options.map((opt) =>
        q.type === "date" ? opt.dateValue : opt.label?.trim(),
      );

      // Check for duplicates
      if (values.some((val, idx) => values.indexOf(val) !== idx)) {
        return { valid: false, error: "Duplicate options" };
      }

      // Check for past dates
      if (q.type === "date") {
        if (
          q.options.some(
            (opt) => opt.dateValue && new Date(opt.dateValue) < now,
          )
        ) {
          return { valid: false, error: "Past date not allowed" };
        }
      }
    }
  }
  return { valid: true };
}

export async function getPoll(pollId, userId) {
  const result = await phpFetch(`/polls/${pollId}/detail`);
  if (!result.ok) return null;

  return result.data?.data || null;
}
