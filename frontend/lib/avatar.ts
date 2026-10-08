// "Monishka Mittal" -> "MM", "Aarav" -> "A"
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Full class names (not built dynamically) so Tailwind can find them in the source.
const COLORS = [
  "bg-zoom-purple",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-orange-600",
  "bg-pink-600",
  "bg-teal-600",
  "bg-indigo-600",
];

// The same name always gets the same color, with no need to store anything.
export function avatarColor(name: string): string {
  let hash = 0;
  for (const ch of name) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
}

// "Monishka Mittal" -> "M" (Zoom shows a single letter on the tile)
export function firstLetter(name: string): string {
  const ch = name.trim()[0];
  return ch ? ch.toUpperCase() : "?";
}