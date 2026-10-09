"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { formatDate, formatFullRange, formatShortDateTime } from "@/lib/format";
import type { Meeting } from "@/lib/types";

interface MeetingCardProps {
  meeting: Meeting;
  variant: "upcoming" | "recent";
}

export default function MeetingCard({ meeting, variant }: MeetingCardProps) {
  const [copied, setCopied] = useState(false);

  // Instant meetings have no scheduled_start, so fall back to created_at.
  const when = meeting.scheduled_start ?? meeting.created_at;

  async function copyInviteLink() {
    if (!meeting.invite_link) return;
    try {
      await navigator.clipboard.writeText(meeting.invite_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked by the browser; fail silently.
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zoom-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 text-sm leading-6">
        <p className="flex min-w-0 items-center gap-2 text-base font-bold">
          <span className="truncate">{meeting.title}</span>
          {meeting.status === "active" && (
            <span className="shrink-0 rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
              In progress
            </span>
          )}
          {variant === "recent" && meeting.status === "scheduled" && (
            <span className="shrink-0 rounded bg-zoom-bg px-2 py-0.5 text-xs font-bold text-zoom-muted">
              Not started
            </span>
          )}
        </p>
        <p>{formatDate(when)}</p>
        <p>
          {variant === "upcoming"
            ? formatFullRange(when, meeting.duration_minutes)
            : formatShortDateTime(when)}
        </p>
        <p className="text-zoom-muted">Meeting ID: {meeting.meeting_code}</p>
        {meeting.host_name && <p>Host: {meeting.host_name}</p>}
      </div>

      {variant === "upcoming" && (
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={copyInviteLink}
            aria-label="Copy invite link"
            className="rounded-lg border border-zoom-border p-2 text-zoom-muted hover:bg-zoom-bg"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <Link
            href={`/meeting/${meeting.meeting_code}?host=1`}
            className="rounded-lg bg-zoom-blue px-4 py-2 text-sm font-bold text-white hover:bg-zoom-blue-dark"
          >
            {meeting.status === "active" ? "Join" : "Start"}
          </Link>
        </div>
      )}
    </div>
  );
}