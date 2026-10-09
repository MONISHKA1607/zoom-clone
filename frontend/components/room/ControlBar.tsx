"use client";

import {
  ArrowUp,
  ChevronUp,
  CircleX,
  Ellipsis,
  Heart,
  LayoutGrid,
  MessageSquare,
  Mic,
  MicOff,
  Shield,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface BarButtonProps {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  caret?: boolean;
  badge?: number;
  active?: boolean;
  placeholder?: boolean; // visual only, not part of the assignment
  pressed?: boolean;
}

function BarButton({ label, icon, onClick, caret, badge, active, placeholder, pressed }: BarButtonProps) {
  return (
    <button
      type="button"
      onClick={placeholder ? undefined : onClick}
      aria-disabled={placeholder || undefined}
      aria-pressed={pressed}
      title={placeholder ? "Not part of this demo" : undefined}
      className={`flex min-w-[60px] flex-col items-center gap-1 rounded-md px-2 py-1.5 text-xs text-white ${
        placeholder ? "cursor-default" : "hover:bg-white/10"
      } ${active ? "bg-white/10" : ""}`}
    >
      <span className="flex h-6 items-center gap-1">
        {icon}
        {badge !== undefined && (
          <span className="-mt-3 text-[10px] text-neutral-300">{badge}</span>
        )}
        {caret && <ChevronUp size={12} className="text-neutral-400" />}
      </span>
      {label}
    </button>
  );
}

// Zoom draws "share" and "more" as a rounded outline with a glyph inside.
function Outlined({ children, round }: { children: ReactNode; round?: boolean }) {
  return (
    <span
      className={`flex h-[22px] w-[22px] items-center justify-center border-2 border-white ${
        round ? "rounded-full" : "rounded-md"
      }`}
    >
      {children}
    </span>
  );
}

interface ControlBarProps {
  micOn: boolean;
  cameraOn: boolean;
  panelOpen: boolean;
  participantCount: number;
  isHost: boolean;
  leaving: boolean;
  endMenuOpen: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onTogglePanel: () => void;
  onOpenEndMenu: () => void;
  onCloseEndMenu: () => void;
  onLeave: () => void;
  onEndForAll: () => void;
  
}

export default function ControlBar({
  micOn,
  cameraOn,
  panelOpen,
  participantCount,
  isHost,
  leaving,
  endMenuOpen,
  onToggleMic,
  onToggleCamera,
  onTogglePanel,
  onOpenEndMenu,
  onCloseEndMenu,
  onLeave,
  onEndForAll,
}: ControlBarProps) {
  // Escape closes the End popup. The cleanup removes the listener when it closes.
  useEffect(() => {
    if (!endMenuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseEndMenu();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [endMenuOpen, onCloseEndMenu]);

  // While the End popup is open, Zoom hides the other controls. `invisible`
  // keeps their space, so Cancel stays at the right edge.
  const hideWhenMenuOpen = endMenuOpen ? "invisible" : "";

  return (
    <footer className="relative flex shrink-0 items-center justify-between bg-black px-2 py-1">
      <div className={`flex items-center ${hideWhenMenuOpen}`}>
        <BarButton
          label="Audio"
          caret
          onClick={onToggleMic}
          pressed={micOn}
          icon={micOn ? <Mic size={22} /> : <MicOff size={22} className="text-red-500" />}
        />
        <BarButton
          label="Video"
          caret
          onClick={onToggleCamera}
          pressed={cameraOn}
          icon={
            cameraOn ? <Video size={22} /> : <VideoOff size={22} className="text-red-500" />
          }
        />
      </div>

      <div className={`flex items-center ${hideWhenMenuOpen}`}>
        <BarButton
          label="Participants"
          caret
          badge={participantCount}
          active={panelOpen}
          onClick={onTogglePanel}
          pressed={panelOpen}
          icon={<Users size={22} />}
        />
        {/* Visual-only buttons: hidden on small screens to save space */}
        <div className="hidden items-center md:flex">
          <BarButton label="Chat" caret placeholder icon={<MessageSquare size={22} />} />
          <BarButton label="React" placeholder icon={<Heart size={22} />} />
          <BarButton
            label="Share"
            caret
            placeholder
            icon={
              <Outlined>
                <ArrowUp size={14} strokeWidth={3} />
              </Outlined>
            }
          />
          {isHost && <BarButton label="Host tools" placeholder icon={<Shield size={22} />} />}
          <BarButton label="Breakout Rooms" placeholder icon={<LayoutGrid size={22} />} />
          <BarButton
            label="More"
            placeholder
            icon={
              <Outlined round>
                <Ellipsis size={14} />
              </Outlined>
            }
          />
        </div>
      </div>

      <div className="relative z-40 flex items-center">
        {endMenuOpen ? (
          <button
            onClick={onCloseEndMenu}
            className="rounded-md bg-[#2b2b2b] px-4 py-2 text-sm text-white hover:bg-[#3a3a3a]"
          >
            Cancel
          </button>
        ) : (
          <BarButton
            label={isHost ? "End" : "Leave"}
            onClick={onOpenEndMenu}
            icon={<CircleX size={24} className="text-red-500" />}
          />
        )}
      </div>

      {endMenuOpen && (
        <>
          {/* Click-away layer, same idea as the info popover */}
          <div className="fixed inset-0 z-30" onClick={onCloseEndMenu} />
          <div className="absolute bottom-full right-2 z-40 mb-2 w-60 space-y-2 rounded-lg bg-[#1f1f1f] p-2 shadow-xl">
            {isHost && (
              <button
                onClick={onEndForAll}
                disabled={leaving}
                className="w-full rounded-md bg-[#e0332d] px-3 py-2.5 text-sm text-white hover:bg-[#c92a25] disabled:opacity-60"
              >
                End Meeting for All
              </button>
            )}
            <button
              onClick={onLeave}
              disabled={leaving}
              className="w-full rounded-md bg-[#333] px-3 py-2.5 text-sm text-white hover:bg-[#444] disabled:opacity-60"
            >
              Leave Meeting
            </button>
          </div>
        </>
      )}
    </footer>
  );
}