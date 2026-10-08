"use client";

import { MicOff } from "lucide-react";
import { useEffect, useRef } from "react";

import { avatarColor, initials } from "@/lib/avatar";

interface ParticipantTileProps {
  name: string;
  isHost: boolean;
  isMe: boolean;
  micMuted?: boolean;
  stream?: MediaStream | null;
}

export default function ParticipantTile({
  name,
  isHost,
  isMe,
  micMuted = false,
  stream = null,
}: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // A MediaStream can't be passed as a JSX attribute, so we attach it to the
  // <video> element through a ref after it renders.
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="relative flex h-full min-h-[140px] items-center justify-center overflow-hidden rounded-xl bg-neutral-800">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted // our own preview must be muted, otherwise we'd hear ourselves
          playsInline
          className="h-full w-full scale-x-[-1] object-cover" // mirrored, like Zoom
        />
      ) : (
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white sm:h-28 sm:w-28 ${avatarColor(name)}`}
        >
          {initials(name)}
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded bg-black/60 px-2 py-0.5 text-sm text-white">
        {micMuted && <MicOff size={14} className="shrink-0 text-red-400" />}
        <span className="truncate">
          {name}
          {isMe && " (Me)"}
        </span>
        {isHost && <span className="shrink-0 text-xs text-neutral-300">· Host</span>}
      </div>
    </div>
  );
}