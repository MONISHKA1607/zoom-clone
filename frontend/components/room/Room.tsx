"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getMeeting, getParticipants, leaveMeeting } from "@/lib/api";
import { clearParticipant } from "@/lib/session";
import type { Meeting, Participant } from "@/lib/types";
import { useCamera } from "@/lib/useCamera";
import ControlBar from "./ControlBar";
import ParticipantsPanel from "./ParticipantsPanel";
import ParticipantTile from "./ParticipantTile";
import RoomHeader from "./RoomHeader";
import Stage from "./Stage";
import Toast from "./Toast";

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

  const camera = useCamera(initialCameraOn);
  const [micOn, setMicOn] = useState(initialMicOn);
  const [panelOpen, setPanelOpen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([participant]);
  const [endMenuOpen, setEndMenuOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [cameraNoticeDismissed, setCameraNoticeDismissed] = useState(false);

  // My role comes from the server's latest list, not from what I joined as,
  // because the host role can be handed to me if the host leaves.
  const me = participants.find((p) => p.id === participant.id) ?? participant;
  const isHost = me.role === "host";

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

  async function leave(endForAll: boolean) {
    setLeaving(true);
    setLeaveError(null);
    try {
      await leaveMeeting(code, participant.id, endForAll);
      clearParticipant(code);
      router.push("/");
    } catch (e) {
      setLeaveError(e instanceof Error ? e.message : "Couldn't leave the meeting");
      setLeaving(false);
      setEndMenuOpen(false);
    }
  }

  function retryCamera() {
    setCameraNoticeDismissed(false);
    camera.toggle(); // turns the camera on again, which re-asks for permission
  }

  const showCameraNotice = camera.error !== null && !cameraNoticeDismissed;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-black text-white">
      <RoomHeader meeting={meeting} />

      <div className="relative flex min-h-0 flex-1">
        <Stage>
          <div
            className={`grid h-full w-full auto-rows-fr gap-0.5 bg-black ${gridClass(participants.length)}`}
          >
            {participants.map((p) => {
              const isMe = p.id === participant.id;
              return (
                <ParticipantTile
                  key={p.id}
                  name={p.display_name}
                  isMe={isMe}
                  micMuted={isMe && !micOn}
                  stream={isMe ? camera.stream : null}
                />
              );
            })}
          </div>
        </Stage>

        {panelOpen && (
          <ParticipantsPanel
            participants={participants}
            myId={participant.id}
            onClose={() => setPanelOpen(false)}
          />
        )}

        {/* Banners float over the video area, like Zoom's */}
        <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex flex-col items-center gap-2 px-2">
          {showCameraNotice && (
            <Toast onDismiss={() => setCameraNoticeDismissed(true)}>
              Please enable access to your{" "}
              <button onClick={retryCamera} className="text-[#4a9bff] underline">
                camera
              </button>{" "}
              for the best experience.
            </Toast>
          )}
          {leaveError && <Toast onDismiss={() => setLeaveError(null)}>{leaveError}</Toast>}
        </div>
      </div>

      <ControlBar
        micOn={micOn}
        cameraOn={camera.enabled}
        panelOpen={panelOpen}
        participantCount={participants.length}
        isHost={isHost}
        leaving={leaving}
        endMenuOpen={endMenuOpen}
        onToggleMic={() => setMicOn((on) => !on)}
        onToggleCamera={camera.toggle}
        onTogglePanel={() => setPanelOpen((open) => !open)}
        onOpenEndMenu={() => setEndMenuOpen(true)}
        onCloseEndMenu={() => setEndMenuOpen(false)}
        onLeave={() => leave(false)}
        onEndForAll={() => leave(true)}
      />
    </div>
  );
}