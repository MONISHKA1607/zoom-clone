"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import PreJoin from "@/components/PreJoin";
import { getMeeting, leaveMeeting } from "@/lib/api";
import { clearParticipant, loadParticipant } from "@/lib/session";
import type { Meeting, Participant } from "@/lib/types";

function CenteredScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-900 p-6 text-white">
      {children}
    </div>
  );
}

// Placeholder room. The real Zoom-style room replaces the last return in a later step.
export default function MeetingRoom() {
  const { code } = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const asHost = searchParams.get("host") === "1";
  const router = useRouter();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [storageChecked, setStorageChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // sessionStorage only exists in the browser, so we read it in an effect.
    setParticipant(loadParticipant(code));
    setStorageChecked(true);
    getMeeting(code)
      .then(setMeeting)
      .catch((e: Error) => setError(e.message));
  }, [code]);

  async function handleLeave() {
    if (!participant) return;
    setLeaving(true);
    setLeaveError(null);
    try {
      await leaveMeeting(code, participant.id);
      clearParticipant(code);
      router.push("/");
    } catch (e) {
      setLeaveError(e instanceof Error ? e.message : "Couldn't leave the meeting");
      setLeaving(false);
    }
  }

  if (error) {
    return (
      <CenteredScreen>
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-lg bg-zoom-blue px-6 py-2 font-bold hover:bg-zoom-blue-dark"
        >
          Back to home
        </button>
      </CenteredScreen>
    );
  }

  // Wait until both the meeting and sessionStorage have been read,
  // otherwise the pre-join screen would flash for people already inside.
  if (!meeting || !storageChecked) {
    return (
      <CenteredScreen>
        <p className="text-neutral-400">Loading meeting...</p>
      </CenteredScreen>
    );
  }

  if (meeting.status === "ended") {
    return (
      <CenteredScreen>
        <p className="text-yellow-400">This meeting has ended.</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-lg bg-zoom-blue px-6 py-2 font-bold hover:bg-zoom-blue-dark"
        >
          Back to home
        </button>
      </CenteredScreen>
    );
  }

  if (!participant) {
    return (
      <PreJoin
        meeting={meeting}
        asHost={asHost}
        onJoined={(updatedMeeting, newParticipant) => {
          setMeeting(updatedMeeting);
          setParticipant(newParticipant);
        }}
      />
    );
  }

  return (
    <CenteredScreen>
      <h1 className="text-2xl font-bold">{meeting.title}</h1>
      <p className="text-neutral-400">Meeting ID: {meeting.meeting_code}</p>
      <p className="text-sm text-neutral-500">{meeting.invite_link}</p>
      <p>
        Joined as <b>{participant.display_name}</b> ({participant.role})
      </p>
      {leaveError && <p className="text-red-400">{leaveError}</p>}
      <button
        onClick={handleLeave}
        disabled={leaving}
        className="mt-4 rounded-lg bg-red-600 px-6 py-2 font-bold hover:bg-red-700 disabled:opacity-60"
      >
        {leaving ? "Leaving..." : "Leave"}
      </button>
    </CenteredScreen>
  );
}