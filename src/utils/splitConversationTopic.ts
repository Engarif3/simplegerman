// Topics are authored as "English title - German title." (hyphen/en dash),
// with a fallback for "English (German)" — mirrors web's
// src/utils/splitConversationTopic.js verbatim.
export function splitConversationTopic(topic: string): {
  english: string;
  german: string | null;
} {
  const trimmed = (topic || "").trim();
  if (!trimmed) return { english: "", german: null };

  const dashParts = trimmed.split(/\s+[-–]\s+/);
  if (dashParts.length === 2 && dashParts[0].trim() && dashParts[1].trim()) {
    return { english: dashParts[0].trim(), german: dashParts[1].trim() };
  }

  const parenMatch = trimmed.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    return { english: parenMatch[1].trim(), german: parenMatch[2].trim() };
  }

  return { english: trimmed, german: null };
}
