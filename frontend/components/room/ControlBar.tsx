import { Mic, MicOff, Users, Video, VideoOff } from "lucide-react";
import type { ReactNode } from "react";

interface ControlButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
}

function ControlButton({ label, icon, onClick, active }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex min-w-[64px] flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-700 ${
        active ? "bg-neutral-700" : ""
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

interface ControlBarProps {
  micOn: boolean;
  cameraOn: boolean;
  panelOpen: boolean;
  participantCount: number;
  isHost: boolean;
  leaving: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onTogglePanel: () => void;
  onLeave: () => void;
}

export default function ControlBar({
  micOn,
  cameraOn,
  panelOpen,
  participantCount,
  isHost,
  leaving,
  onToggleMic,
  onToggleCamera,
  onTogglePanel,
  onLeave,
}: ControlBarProps) {
  return (
    <footer className="flex items-center justify-between border-t border-neutral-800 bg-[#1c1c1c] px-2 py-2">
      <div className="flex items-center">
        <ControlButton
          label={micOn ? "Mute" : "Unmute"}
          onClick={onToggleMic}
          icon={micOn ? <Mic size={22} /> : <MicOff size={22} className="text-red-500" />}
        />
        <ControlButton
          label={cameraOn ? "Stop Video" : "Start Video"}
          onClick={onToggleCamera}
          icon={
            cameraOn ? <Video size={22} /> : <VideoOff size={22} className="text-red-500" />
          }
        />
      </div>

      <ControlButton
        label="Participants"
        onClick={onTogglePanel}
        active={panelOpen}
        icon={
          <span className="relative">
            <Users size={22} />
            <span className="absolute -right-4 -top-2 rounded-full bg-neutral-600 px-1.5 text-[10px] leading-4">
              {participantCount}
            </span>
          </span>
        }
      />

      <button
        onClick={onLeave}
        disabled={leaving}
        className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
      >
        {isHost ? "End" : "Leave"}
      </button>
    </footer>
  );
}