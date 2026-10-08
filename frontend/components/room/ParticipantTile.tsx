"use client";

import { MicOff } from "lucide-react";
import { useEffect, useRef } from "react";

import { avatarColor, firstLetter } from "@/lib/avatar";

interface ParticipantTileProps {
  name: string;
  isMe: boolean;
  micMuted?: boolean;
  stream?: MediaStream | null;
}

export default function ParticipantTile({
  name,
  isMe,
  micMuted = false,
  stream = null,
}: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // A MediaStream can't be passed as a JSX attribute, so we attach it through a ref.
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-[#1c1c1c]">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted // our own preview must be muted, otherwise we'd hear ourselves
          playsInline
          className="h-full w-full scale-x-[-1] object-cover" // mirrored, like Zoom
        />
      ) : (
        // Zoom shows a square with a single letter, not a circle.
        <div
          className={`flex h-16 w-16 items-center justify-center text-3xl text-white sm:h-[90px] sm:w-[90px] sm:text-5xl ${
            isMe ? "bg-zoom-purple" : avatarColor(name)
          }`}
        >
          {firstLetter(name)}
        </div>
      )}

      <div className="absolute bottom-0 left-0 flex max-w-full items-center gap-1.5 bg-black/70 px-2 py-1 text-xs text-white">
        {micMuted && <MicOff size={12} className="shrink-0 text-red-400" />}
        <span className="truncate">{name}</span>
      </div>
    </div>
  );
}