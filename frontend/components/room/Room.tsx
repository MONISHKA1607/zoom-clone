"use client";

import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Modal from "@/components/Modal";
import { getMeeting, getParticipants, leaveMeeting } from "@/lib/api";
import { clearParticipant } from "@/lib/session";
import type { Meeting, Participant } from "@/lib/types";
import { useCamera } from "@/lib/useCamera";
import ControlBar from "./ControlBar";
import ParticipantsPanel from "./ParticipantsPanel";
import ParticipantTile from "./ParticipantTile";

const POLL_INTERVAL_MS = 3000;

// How many columns the video grid uses for a given number of people.
function gridClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count <= 4) return "grid-cols-1 sm:grid-cols-2";
  if (count <= 9) return "grid-cols-2 lg:grid-cols-3";
  return "grid-cols-3 lg:grid-cols-4";
}

interface RoomProps {
  meeting: Meeting;
  participant: Participant; // "me": who I joined as
  initialMicOn: boolean;
  initialCameraOn: boolean;
  onEnded: () => void; // called when we discover the host ended the meeting
}

export default function Room({
  meeting,
  participant,
  initialMicOn,
  initialCameraOn,
  onEnded,
}: RoomProps) {
  const router = useRouter();
  const code = meeting.meeting_code;
  const isHost = participant.role === "host";

  const camera = useCamera(initialCameraOn);
  const [micOn, setMicOn] = useState(initialMicOn);
  const [panelOpen, setPanelOpen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([participant]);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Polling: every few seconds ask the server who is here and whether the meeting is still on.
  useEffect(() => {
    let stopped = false;

    async function refresh() {
      try {
        const [latestMeeting, latestParticipants] = await Promise.all([
          getMeeting(code),
          getParticipants(code),
        ]);
        if (stopped) return;
        if (latestMeeting.status === "ended") {
          onEnded();
          return;
        }
        setParticipants(latestParticipants);
      } catch {
        // A network blip: keep showing the last known list and try again next tick.
      }
    }

    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      stopped = true; // ignore any request that finishes after we've left
      clearInterval(id);
    };
  }, [code, onEnded]);

  async function leave() {
    setLeaving(true);
    setLeaveError(null);
    try {
      await leaveMeeting(code, participant.id);
      clearParticipant(code);
      router.push("/");
    } catch (e) {
      setLeaveError(e instanceof Error ? e.message : "Couldn't leave the meeting");
      setLeaving(false);
      setConfirmEnd(false);
    }
  }

  // The host's "End" closes the meeting for everyone, so ask first.
  function handleLeaveClick() {
    if (isHost) setConfirmEnd(true);
    else void leave();
  }

  async function copyInviteLink() {
    if (!meeting.invite_link) return;
    try {
      await navigator.clipboard.writeText(meeting.invite_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; ignore.
    }
  }

  const message = camera.error ?? leaveError;

  return (
    <div className="flex h-dvh flex-col bg-[#1c1c1c] text-white">
      <header className="flex items-center justify-between gap-3 px-4 py-2">
        <div className="min-w-0">
          <p className="truncate font-bold">{meeting.title}</p>
          <p className="text-xs text-neutral-400">Meeting ID: {code}</p>
        </div>
        <button
          onClick={copyInviteLink}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-600"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy invite link"}
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1 gap-2 px-2 pb-2">
        <div
          className={`grid min-w-0 flex-1 auto-rows-fr gap-2 overflow-y-auto ${gridClass(participants.length)}`}
        >
          {participants.map((p) => {
            const isMe = p.id === participant.id;
            return (
              <ParticipantTile
                key={p.id}
                name={p.display_name}
                isHost={p.role === "host"}
                isMe={isMe}
                micMuted={isMe && !micOn}
                stream={isMe ? camera.stream : null}
              />
            );
          })}
        </div>

        {panelOpen && (
          <ParticipantsPanel
            participants={participants}
            myId={participant.id}
            onClose={() => setPanelOpen(false)}
          />
        )}
      </div>

      {message && <p className="px-4 pb-2 text-center text-sm text-red-400">{message}</p>}

      <ControlBar
        micOn={micOn}
        cameraOn={camera.enabled}
        panelOpen={panelOpen}
        participantCount={participants.length}
        isHost={isHost}
        leaving={leaving}
        onToggleMic={() => setMicOn((on) => !on)}
        onToggleCamera={camera.toggle}
        onTogglePanel={() => setPanelOpen((open) => !open)}
        onLeave={handleLeaveClick}
      />

      {confirmEnd && (
        <Modal title="End meeting for all?" onClose={() => setConfirmEnd(false)}>
          <p className="mb-4 text-sm text-zoom-muted">
            Everyone will be removed and the meeting will close. It will then appear under
            Recent meetings.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmEnd(false)}
              className="rounded-lg px-4 py-2 text-sm font-bold text-zoom-muted hover:bg-zoom-bg"
            >
              Cancel
            </button>
            <button
              onClick={leave}
              disabled={leaving}
              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {leaving ? "Ending..." : "End meeting for all"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}