const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const shortDateFmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

// The API sends UTC ISO strings; new Date() converts them to the user's local time.
export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

// "Oct 8 11:30 PM"
export function formatShortDateTime(iso: string): string {
  const d = new Date(iso);
  return `${shortDateFmt.format(d)} ${timeFmt.format(d)}`;
}

// "Oct 8 11:30 PM - Oct 9 12:10 AM" (Zoom shows the date on both ends)
export function formatFullRange(iso: string, durationMinutes: number | null): string {
  if (!durationMinutes) return formatShortDateTime(iso);
  const end = new Date(new Date(iso).getTime() + durationMinutes * 60_000);
  return `${formatShortDateTime(iso)} - ${shortDateFmt.format(end)} ${timeFmt.format(end)}`;
}