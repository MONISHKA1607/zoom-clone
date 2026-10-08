import { X } from "lucide-react";

import { avatarColor, initials } from "@/lib/avatar";
import type { Participant } from "@/lib/types";

interface ParticipantsPanelProps {
  participants: Participant[];
  myId: number;
  onClose: () => void;
}

export default function ParticipantsPanel({
  participants,
  myId,
  onClose,
}: ParticipantsPanelProps) {
  return (
    // Phone: covers the video area. Larger screens: a 320px column beside the grid.
    <aside className="absolute inset-0 z-20 flex flex-col bg-[#1c1c1c] sm:static sm:w-80 sm:shrink-0 sm:border-l sm:border-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-700 px-4 py-3">
        <h2 className="font-bold">Participants ({participants.length})</h2>
        <button
          onClick={onClose}
          aria-label="Close participants panel"
          className="rounded-full p-1 hover:bg-neutral-700"
        >
          <X size={18} />
        </button>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto p-2">
        {participants.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-neutral-700/50"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(p.display_name)}`}
            >
              {initials(p.display_name)}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {p.display_name}
              {p.id === myId && " (Me)"}
            </span>
            {p.role === "host" && (
              <span className="rounded bg-neutral-700 px-2 py-0.5 text-xs">Host</span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}