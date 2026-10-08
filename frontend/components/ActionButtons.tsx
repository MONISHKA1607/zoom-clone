import { ChevronDown, Plus, VideoOff } from "lucide-react";
import type { ReactNode } from "react";

interface ActionTileProps {
  label: string;
  icon: ReactNode;
  color: string;
  onClick: () => void;
  hasDropdown?: boolean;
}

function ActionTile({ label, icon, color, onClick, hasDropdown }: ActionTileProps) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-3 focus:outline-none"
    >
      <span
        className={`flex h-[70px] w-[70px] items-center justify-center rounded-[22px] text-white transition group-hover:brightness-90 group-focus-visible:ring-2 group-focus-visible:ring-zoom-blue group-focus-visible:ring-offset-2 ${color}`}
      >
        {icon}
      </span>
      <span className="flex items-center gap-1 text-base text-zoom-muted">
        {label}
        {hasDropdown && <ChevronDown size={16} />}
      </span>
    </button>
  );
}

interface ActionButtonsProps {
  onNewMeeting: () => void;
  onJoin: () => void;
  onSchedule: () => void;
}

export default function ActionButtons({
  onNewMeeting,
  onJoin,
  onSchedule,
}: ActionButtonsProps) {
  return (
    <div className="flex justify-center gap-10 sm:gap-14">
      <ActionTile
        label="New meeting"
        hasDropdown
        color="bg-zoom-orange"
        icon={<VideoOff size={34} strokeWidth={2.5} />}
        onClick={onNewMeeting}
      />
      <ActionTile
        label="Join"
        color="bg-zoom-blue"
        icon={
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-zoom-blue">
            <Plus size={24} strokeWidth={3} />
          </span>
        }
        onClick={onJoin}
      />
      <ActionTile
        label="Schedule"
        color="bg-zoom-blue"
        icon={
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-black text-zoom-blue">
            19
          </span>
        }
        onClick={onSchedule}
      />
    </div>
  );
}