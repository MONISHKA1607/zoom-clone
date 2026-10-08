const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

// The API sends UTC ISO strings; new Date() converts them to the user's local time.
export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function formatTimeRange(iso: string, durationMinutes: number | null): string {
  const start = new Date(iso);
  if (!durationMinutes) return timeFmt.format(start);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return `${timeFmt.format(start)} – ${timeFmt.format(end)}`;
}