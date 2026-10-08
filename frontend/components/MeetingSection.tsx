import MeetingCard from "./MeetingCard";
import type { Meeting } from "@/lib/types";

interface MeetingSectionProps {
  title: string;
  meetings: Meeting[];
  loading: boolean;
  error: string | null;
  emptyText: string;
  variant: "upcoming" | "recent";
}

export default function MeetingSection({
  title,
  meetings,
  loading,
  error,
  emptyText,
  variant,
}: MeetingSectionProps) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-black">{title}</h2>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-[74px] animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && meetings.length === 0 && (
        <p className="rounded-xl border border-dashed border-zoom-border bg-white p-6 text-center text-sm text-zoom-muted">
          {emptyText}
        </p>
      )}

      {!loading && !error && meetings.length > 0 && (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} variant={variant} />
          ))}
        </div>
      )}
    </section>
  );
}