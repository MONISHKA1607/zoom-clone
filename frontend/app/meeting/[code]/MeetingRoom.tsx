"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getMeeting, leaveMeeting } from "@/lib/api";
import { clearParticipant, loadParticipant } from "@/lib/session";
import type { Meeting, Participant } from "@/lib/types";

// Placeholder room. The real Zoom-style room replaces this in a later step.
export default function MeetingRoom() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Read storage inside an effect: it only exists in the browser, not on the server.
    setParticipant(loadParticipant(code));
    getMeeting(code)
      .then(setMeeting)
      .catch((e: Error) => setError(e.message));
  }, [code]);

  async function handleLeave() {
    if (!participant) {
      router.push("/");
      return;
    }
    setLeaving(true);
    try {
      await leaveMeeting(code, participant.id);
      clearParticipant(code);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't leave the meeting");
      setLeaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-900 p-6 text-white">
      {error && <p className="text-red-400">{error}</p>}

      {!error && !meeting && <p className="text-neutral-400">Loading meeting...</p>}

      {meeting && (
        <>
          <h1 className="text-2xl font-bold">{meeting.title}</h1>
          <p className="text-neutral-400">Meeting ID: {meeting.meeting_code}</p>
          <p className="text-sm text-neutral-500">{meeting.invite_link}</p>

          {meeting.status === "ended" && (
            <p className="text-yellow-400">This meeting has ended.</p>
          )}

          {participant ? (
            <p>
              Joined as <b>{participant.display_name}</b> ({participant.role})
            </p>
          ) : (
            <p className="text-neutral-400">You haven&apos;t joined this meeting yet.</p>
          )}
        </>
      )}

      <button
        onClick={handleLeave}
        disabled={leaving}
        className="mt-4 rounded-lg bg-red-600 px-6 py-2 font-bold hover:bg-red-700 disabled:opacity-60"
      >
        {leaving ? "Leaving..." : participant ? "Leave" : "Back to home"}
      </button>
    </div>
  );
}