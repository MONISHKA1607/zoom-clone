"use client";

import { useState, type FormEvent } from "react";

import { joinMeeting } from "@/lib/api";
import { saveParticipant } from "@/lib/session";
import type { Meeting, Participant } from "@/lib/types";

interface PreJoinProps {
  meeting: Meeting;
  asHost: boolean;
  onJoined: (meeting: Meeting, participant: Participant) => void;
}

export default function PreJoin({ meeting, asHost, onJoined }: PreJoinProps) {
  // The host's name is prefilled; guests type their own.
  const [name, setName] = useState(asHost ? (meeting.host_name ?? "") : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await joinMeeting(
        meeting.meeting_code,
        trimmed,
        asHost ? meeting.host_id : null
      );
      saveParticipant(result.meeting.meeting_code, result.participant);
      onJoined(result.meeting, result.participant);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't join the meeting.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl"
      >
        <div>
          <h1 className="text-xl font-bold">{meeting.title}</h1>
          <p className="text-sm text-zoom-muted">Meeting ID: {meeting.meeting_code}</p>
        </div>

        <div>
          <label htmlFor="display-name" className="mb-1 block text-sm font-bold">
            Your name
          </label>
          <input
            id="display-name"
            autoFocus
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full rounded-lg border border-zoom-border px-3 py-2 outline-none focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/30"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-zoom-blue py-2.5 font-bold text-white hover:bg-zoom-blue-dark disabled:opacity-60"
        >
          {submitting ? "Joining..." : asHost ? "Start meeting" : "Join"}
        </button>
      </form>
    </div>
  );
}