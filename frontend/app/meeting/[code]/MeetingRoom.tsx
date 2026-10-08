"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import PreJoin, { type JoinSettings } from "@/components/PreJoin";
import Room from "@/components/room/Room";
import { getMeeting } from "@/lib/api";
import { clearParticipant, loadParticipant } from "@/lib/session";
import type { Meeting, Participant } from "@/lib/types";

function CenteredScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-900 p-6 text-white">
      {children}
    </div>
  );
}

const DEFAULT_SETTINGS: JoinSettings = { micOn: true, cameraOn: false };

export default function MeetingRoom() {
  const { code } = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const asHost = searchParams.get("host") === "1";
  const router = useRouter();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [settings, setSettings] = useState<JoinSettings>(DEFAULT_SETTINGS);
  const [storageChecked, setStorageChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // sessionStorage only exists in the browser, so we read it in an effect.
    setParticipant(loadParticipant(code));
    setStorageChecked(true);
    getMeeting(code)
      .then(setMeeting)
      .catch((e: Error) => setError(e.message));
  }, [code]);

  // Called by the room when polling finds that the host ended the meeting.
  // useCallback keeps the function identity stable, so the room's polling
  // effect doesn't restart on every render.
  const handleEnded = useCallback(() => {
    clearParticipant(code);
    setMeeting((m) => (m ? { ...m, status: "ended" } : m));
  }, [code]);

  const backButton = (
    <button
      onClick={() => router.push("/")}
      className="rounded-lg bg-zoom-blue px-6 py-2 font-bold hover:bg-zoom-blue-dark"
    >
      Back to home
    </button>
  );

  if (error) {
    return (
      <CenteredScreen>
        <p className="text-red-400">{error}</p>
        {backButton}
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
        {backButton}
      </CenteredScreen>
    );
  }

  if (!participant) {
    return (
      <PreJoin
        meeting={meeting}
        asHost={asHost}
        onJoined={(updatedMeeting, newParticipant, chosen) => {
          setMeeting(updatedMeeting);
          setSettings(chosen);
          setParticipant(newParticipant);
        }}
      />
    );
  }

  return (
    <Room
      meeting={meeting}
      participant={participant}
      initialMicOn={settings.micOn}
      initialCameraOn={settings.cameraOn}
      onEnded={handleEnded}
    />
  );
}