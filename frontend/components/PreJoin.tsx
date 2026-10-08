"use client";

import { Mic, Video } from "lucide-react";
import { useState, type FormEvent } from "react";

import { joinMeeting } from "@/lib/api";
import { saveParticipant } from "@/lib/session";
import type { Meeting, Participant } from "@/lib/types";
import Stage from "./room/Stage";

// What the user chose on this screen; the room starts with the same settings.
export interface JoinSettings {
  micOn: boolean;
  cameraOn: boolean;
}

interface PreJoinProps {
  meeting: Meeting;
  asHost: boolean;
  onJoined: (meeting: Meeting, participant: Participant, settings: JoinSettings) => void;
}

// A simple stand-in for Zoom's artwork.
function Illustration() {
  return (
    <div className="relative mx-auto flex h-40 w-56 items-center justify-center rounded-xl bg-[#e9edff]">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6f8cff] text-white">
        <Video size={32} />
      </span>
      <span className="absolute right-10 top-8 flex h-10 w-10 items-center justify-center rounded-xl bg-[#3b3bd6] text-white">
        <Mic size={20} />
      </span>
    </div>
  );
}

export default function PreJoin({ meeting, asHost, onJoined }: PreJoinProps) {
  const hostName = meeting.host_name ?? "";
  const [name, setName] = useState(asHost ? hostName : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zoom knows who you are because you're logged in. We only ask guests.
  const needsName = !(asHost && hostName);

  async function join(settings: JoinSettings) {
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
      onJoined(result.meeting, result.participant, settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't join the meeting.");
      setSubmitting(false);
    }
  }

  // Enter in the name box = the primary button.
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void join({ micOn: true, cameraOn: true });
  }

  return (
    <div className="relative flex min-h-0 flex-1 overflow-y-auto bg-black text-white">
      {/* The dark video area sits behind the card, with the name label like Zoom's */}
      <div className="absolute inset-0 flex">
        <Stage className="bg-[#141414]">
          {name.trim() && (
            <span className="absolute bottom-0 left-0 bg-black/70 px-2 py-1 text-xs">
              {name.trim()}
            </span>
          )}
        </Stage>
      </div>

      {/* m-auto centers the card, and lets it scroll instead of being cut off when short */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 m-auto w-full max-w-[460px] rounded-xl border border-neutral-700 bg-[#1c1c1c] px-6 py-8 text-center sm:px-10"
      >
        <Illustration />

        <h1 className="mt-6 text-lg font-bold">
          Do you want people to see you in the meeting?
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          You can still turn off your microphone and camera anytime in the meeting
        </p>

        {needsName && (
          <div className="mt-5 text-left">
            <label htmlFor="display-name" className="sr-only">
              Your name
            </label>
            <input
              id="display-name"
              autoFocus
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-md border border-neutral-600 bg-[#2a2a2a] px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:border-[#0e72ed]"
            />
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#0e72ed] px-4 py-2.5 text-sm font-bold hover:bg-[#0b5cd5] disabled:opacity-60"
        >
          <Video size={16} />
          {submitting ? "Joining..." : "Use microphone and camera"}
        </button>

        <div className="mt-3">
          {/* type="button": buttons inside a form submit it by default */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => void join({ micOn: false, cameraOn: false })}
            className="text-sm text-[#4a9bff] hover:underline disabled:opacity-60"
          >
            Continue without microphone and camera
          </button>
        </div>
      </form>
    </div>
  );
}